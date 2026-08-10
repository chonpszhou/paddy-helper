// =============================================
// h5api · 网页版完整功能云函数
// 承载小程序合规版不包含的功能：活动相册（上传/投票/排名）、留言、AI 小记
// 数据存放在独立集合 h5_extras，避免被小程序的活动同步覆盖
// 访问控制：凭圈子通行码（code）验证身份，与小程序加入圈子同源
// =============================================
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const circles = db.collection('circles')
const activities = db.collection('activities')
const extras = db.collection('h5_extras')

const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

function genCircleCode() {
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length))
  }
  return code
}

async function ensureExtrasCollection() {
  try {
    await extras.limit(1).get()
    return true
  } catch (e) {
    try {
      await db.createCollection('h5_extras')
      return true
    } catch (e2) {
      return false
    }
  }
}

async function getCircleByCode(code) {
  const key = String(code || '').trim().toUpperCase().slice(0, 20)
  if (!key) return null
  const res = await circles.where({ code: key }).limit(1).get()
  return res.data[0] || null
}

async function getActivitySafe(circleId, activityId) {
  if (!activityId) return null
  try {
    const res = await activities.doc(activityId).get()
    const a = res.data
    if (!a || a.circleId !== circleId) return null
    return a
  } catch (e) {
    return null
  }
}

async function getExtras(activityId) {
  try {
    const res = await extras.doc(activityId).get()
    return res.data || { photos: [], comments: [] }
  } catch (e) {
    return { photos: [], comments: [] }
  }
}

async function saveExtras(activityId, data) {
  await extras.doc(activityId).set({
    data: Object.assign({}, data, { activityId: activityId, updatedAt: db.serverDate() })
  })
}

async function photosWithTempUrl(photos) {
  const fileIDs = (photos || []).filter(function (p) { return /^cloud:\/\//.test(p.src || '') }).map(function (p) { return p.src })
  const map = {}
  if (fileIDs.length) {
    try {
      const t = await cloud.getTempFileURL({ fileList: fileIDs })
      ;(t.fileList || []).forEach(function (x) { map[x.fileID] = x.tempFileURL })
    } catch (e) {
      console.error('[h5api] getTempFileURL 失败', e)
    }
  }
  return (photos || []).map(function (p) {
    return Object.assign({}, p, { src: map[p.src] || p.src })
  })
}

exports.main = async (event) => {
  const action = (event && event.action) || ''
  const code = (event && event.code) || ''
  try {
    // 1. 凭通行码验证圈子
    if (action === 'verifyCircle') {
      const circle = await getCircleByCode(code)
      if (!circle) return { ok: false, error: '圈子不存在，通行码不对哦' }
      return { ok: true, circle: { _id: circle._id, name: circle.name, code: circle.code } }
    }

    // 1.5 网页版创建圈子（没有通行码也能开始用）
    if (action === 'createCircle') {
      const name = String(event.name || '').trim().slice(0, 20)
      if (!name) return { ok: false, error: '给圈子起个名字吧' }
      const uid = String(event.uid || '').slice(0, 64)
      if (!uid) return { ok: false, error: '缺少身份标识' }
      let newCode = ''
      for (let i = 0; i < 5; i++) {
        newCode = genCircleCode()
        const exist = await circles.where({ code: newCode }).limit(1).get()
        if (!exist.data.length) break
        newCode = ''
      }
      if (!newCode) return { ok: false, error: '生成通行码失败，请重试' }
      const add = await circles.add({
        data: {
          name: name,
          code: newCode,
          creatorUid: uid,
          memberUids: [uid],
          memberOpenids: [],
          createdAt: db.serverDate()
        }
      })
      return { ok: true, circle: { _id: add._id, name: name, code: newCode } }
    }

    // 2. 圈子活动列表
    if (action === 'listActivities') {
      const circle = await getCircleByCode(code)
      if (!circle) return { ok: false, error: '圈子不存在，通行码不对哦' }
      const res = await activities.where({ circleId: circle._id }).orderBy('startTime', 'asc').limit(100).get()
      const list = res.data.map(function (a) {
        return {
          _id: a._id,
          type: a.type,
          title: a.title,
          startTime: a.startTime,
          location: a.location,
          status: a.status,
          signupCount: (a.signups || []).length
        }
      })
      return { ok: true, circle: { _id: circle._id, name: circle.name }, activities: list }
    }

    // 3. 活动详情（含网页版相册与留言）
    if (action === 'getActivity') {
      const circle = await getCircleByCode(code)
      if (!circle) return { ok: false, error: '圈子不存在，通行码不对哦' }
      const a = await getActivitySafe(circle._id, event.activityId)
      if (!a) return { ok: false, error: '活动不存在或不在这个圈子里' }
      const ex = await getExtras(a._id)
      const photos = await photosWithTempUrl(ex.photos)
      return {
        ok: true,
        activity: {
          _id: a._id,
          type: a.type,
          title: a.title,
          startTime: a.startTime,
          location: a.location,
          description: a.description,
          status: a.status,
          creatorName: a.creatorName || '',
          signupCount: (a.signups || []).length,
          photos: photos,
          comments: (ex.comments || []).slice().sort(function (x, y) { return (x.at || 0) - (y.at || 0) })
        }
      }
    }

    // 4. 上传照片（base64，云端转存云存储）
    if (action === 'addPhoto') {
      const circle = await getCircleByCode(code)
      if (!circle) return { ok: false, error: '圈子不存在，通行码不对哦' }
      const a = await getActivitySafe(circle._id, event.activityId)
      if (!a) return { ok: false, error: '活动不存在' }
      const dataUrl = String(event.dataUrl || '')
      const m = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/)
      if (!m) return { ok: false, error: '图片格式不对' }
      const buf = Buffer.from(m[2], 'base64')
      if (!buf.length || buf.length > 5 * 1024 * 1024) {
        return { ok: false, error: '图片太大，请压缩后再传' }
      }
      const ext = m[1] === 'png' ? 'png' : 'jpg'
      const cloudPath = 'photos/' + circle._id + '/' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.' + ext
      const up = await cloud.uploadFile({ cloudPath: cloudPath, fileContent: buf })
      const photo = {
        id: 'p' + Date.now() + Math.floor(Math.random() * 1000),
        src: up.fileID,
        likes: [],
        dislikes: [],
        createdAt: Date.now()
      }
      const ex = await getExtras(a._id)
      ex.photos = (ex.photos || []).concat([photo])
      await saveExtras(a._id, ex)
      return { ok: true, photo: photo }
    }

    // 5. 相册投票（👍/👎）
    if (action === 'toggleVote') {
      const circle = await getCircleByCode(code)
      if (!circle) return { ok: false, error: '圈子不存在，通行码不对哦' }
      const a = await getActivitySafe(circle._id, event.activityId)
      if (!a) return { ok: false, error: '活动不存在' }
      const uid = String(event.uid || '').slice(0, 64)
      if (!uid) return { ok: false, error: '缺少身份标识' }
      const ex = await getExtras(a._id)
      ex.photos = (ex.photos || []).map(function (p) {
        if (p.id !== event.photoId) return p
        const likes = (p.likes || []).slice()
        const dislikes = (p.dislikes || []).slice()
        const li = likes.indexOf(uid)
        const di = dislikes.indexOf(uid)
        if (event.type === 'like') {
          if (li >= 0) {
            likes.splice(li, 1)
          } else {
            likes.push(uid)
            if (di >= 0) dislikes.splice(di, 1)
          }
        } else {
          if (di >= 0) {
            dislikes.splice(di, 1)
          } else {
            dislikes.push(uid)
            if (li >= 0) likes.splice(li, 1)
          }
        }
        return Object.assign({}, p, { likes: likes, dislikes: dislikes })
      })
      await saveExtras(a._id, ex)
      const photos = await photosWithTempUrl(ex.photos)
      return { ok: true, photos: photos }
    }

    // 6. 留言
    if (action === 'addComment') {
      const circle = await getCircleByCode(code)
      if (!circle) return { ok: false, error: '圈子不存在，通行码不对哦' }
      const a = await getActivitySafe(circle._id, event.activityId)
      if (!a) return { ok: false, error: '活动不存在' }
      const text = String(event.text || '').trim().slice(0, 200)
      const author = String(event.author || '朋友').trim().slice(0, 20) || '朋友'
      if (!text) return { ok: false, error: '写点内容再发吧' }
      const ex = await getExtras(a._id)
      ex.comments = (ex.comments || []).concat([{
        id: 'c' + Date.now() + Math.floor(Math.random() * 1000),
        author: author,
        text: text,
        at: Date.now()
      }])
      await saveExtras(a._id, ex)
      return { ok: true }
    }

    // 7. AI 小记（复用 ai 云函数）
    if (action === 'aiCall') {
      const circle = await getCircleByCode(code)
      if (!circle) return { ok: false, error: '圈子不存在，通行码不对哦' }
      const a = await getActivitySafe(circle._id, event.activityId)
      if (!a) return { ok: false, error: '活动不存在' }
      const ex = await getExtras(a._id)
      const comments = (ex.comments || []).slice(-5).map(function (c) { return c.author + '：' + c.text }).join('；')
      const photos = ex.photos || []
      const photoInfo = photos.length ? '共 ' + photos.length + ' 张照片' : '暂无照片'
      const names = (a.signups || []).slice(0, 8).map(function (s) { return s.name || '' }).filter(Boolean).join('、')
      const aiRes = await cloud.callFunction({
        name: 'ai',
        data: {
          action: 'summary',
          title: a.title,
          type: a.type,
          time: a.startTime ? new Date(a.startTime).toLocaleString('zh-CN') : '',
          location: a.location || '地点待定',
          participants: names || '还没人报名',
          comments: comments || '暂无留言',
          photoInfo: photoInfo
        }
      })
      const r = aiRes.result || {}
      return { ok: !!r.ok, data: r.data, error: r.error }
    }

    return { ok: false, error: '未知操作' }
  } catch (e) {
    console.error('[h5api]', action, e)
    return { ok: false, error: (e && e.message) || '服务器开小差了' }
  }
}
