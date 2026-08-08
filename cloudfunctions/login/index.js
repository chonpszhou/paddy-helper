const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command
const users = db.collection('users')
const circles = db.collection('circles')

// 通行码字符集：去掉易混淆的 0/O、1/I/L，只保留大写字母和数字
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

function genCircleCode() {
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length))
  }
  return code
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise(function (_, reject) {
      setTimeout(function () {
        reject(new Error('cloud timeout'))
      }, ms || 8000)
    })
  ])
}

// 文本安全校验：内容安全接口不可用时放行，仅在有明确风险时拦截
async function textSafe(content, scene) {
  if (!content || typeof content !== 'string') return true
  const text = content.trim()
  if (!text || text.length > 2500) return true
  try {
    const { OPENID } = cloud.getWXContext()
    const res = await withTimeout(cloud.openapi.security.msgSecCheck({
      version: 2,
      scene: scene || 1,
      openid: OPENID,
      content: text
    }), 6000)
    const suggest = res && res.result && res.result.suggest
    return suggest !== 'risky'
  } catch (e) {
    console.error('[security] msgSecCheck 失败', e)
    return true
  }
}

async function ensureCircleCollection() {
  try {
    await circles.limit(1).get()
    return true
  } catch (e) {
    try {
      await withTimeout(db.createCollection('circles'), 6000)
      console.log('[circles] 已自动创建 circles 集合')
      return true
    } catch (e2) {
      console.error('[circles] 自动创建集合失败，请手动创建 circles', e2)
      return false
    }
  }
}

async function getCircleById(id) {
  if (!id) return null
  try {
    const res = await circles.doc(id).get()
    return res.data || null
  } catch (e) {
    return null
  }
}

async function isMember(circleId, openid) {
  const c = await getCircleById(circleId)
  return !!(c && (c.memberOpenids || []).indexOf(openid) >= 0)
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) {
    return { ok: false, error: 'no openid' }
  }

  const action = event && event.action ? event.action : 'get'

  if (action === 'get') {
    const res = await users.where({ openid: OPENID }).limit(1).get()
    return { ok: true, openid: OPENID, user: res.data[0] || null }
  }

  // 创建圈子：任何人可以创建，创建者自动成为第一个成员
  if (action === 'createCircle') {
    console.log('[createCircle] 开始', event.name)
    const circleColOk = await ensureCircleCollection()
    if (!circleColOk) {
      return { ok: false, error: '云端缺少 circles 集合，请在云开发控制台 → 数据库 → 新建集合 circles' }
    }
    console.log('[createCircle] 集合就绪')
    const name = String(event.name || '').trim().slice(0, 20)
    if (!name) return { ok: false, error: '请填写圈子名称' }
    if (!(await textSafe(name, 1))) {
      return { ok: false, error: '圈子名称包含不适合的内容' }
    }
    console.log('[createCircle] 内容检查通过')
    // 自动生成随机通行码，避免用户使用过于简单的码导致圈子偶然相遇
    let code = ''
    for (let i = 0; i < 5; i++) {
      code = genCircleCode()
      const exist = await circles.where({ code: code }).limit(1).get()
      if (!exist.data.length) break
      code = ''
    }
    if (!code) return { ok: false, error: '生成通行码失败，请重试' }
    const add = await circles.add({
      data: {
        name: name,
        code: code,
        creatorOpenid: OPENID,
        memberOpenids: [OPENID],
        createdAt: db.serverDate()
      }
    })
    console.log('[createCircle] 创建成功', code)
    return { ok: true, circle: { _id: add._id, name: name, code: code, creatorOpenid: OPENID } }
  }

  // 凭通行码加入圈子（重复加入不会报错）
  if (action === 'verifyCircle') {
    console.log('[verifyCircle] 开始', event.code)
    const circleColOk = await ensureCircleCollection()
    if (!circleColOk) {
      return { ok: false, error: '云端缺少 circles 集合，请在云开发控制台 → 数据库 → 新建集合 circles' }
    }
    const code = String(event.code || '').trim().toUpperCase().slice(0, 20)
    if (!code) return { ok: false, error: '请输入通行码' }
    const exist = await circles.where({ code: code }).limit(1).get()
    if (!exist.data.length) {
      return { ok: false, error: '圈子不存在，通行码不对哦' }
    }
    const circle = exist.data[0]
    const members = circle.memberOpenids || []
    if (members.indexOf(OPENID) < 0) {
      members.push(OPENID)
      await circles.doc(circle._id).update({ data: { memberOpenids: members } })
    }
    console.log('[verifyCircle] 成功', circle._id)
    return { ok: true, circle: { _id: circle._id, name: circle.name, code: circle.code, creatorOpenid: circle.creatorOpenid || '' } }
  }

  // 我加入过的圈子列表
  if (action === 'getMyCircles') {
    const circleColOk = await ensureCircleCollection()
    if (!circleColOk) return { ok: true, circles: [] }
    const res = await circles.limit(100).get()
    const mine = res.data
      .filter(function (c) { return (c.memberOpenids || []).indexOf(OPENID) >= 0 })
      .map(function (c) { return { _id: c._id, name: c.name, code: c.code, creatorOpenid: c.creatorOpenid || '' } })
    return { ok: true, circles: mine }
  }

  // 退出圈子：把自己从成员列表移除；圈里没人了自动清理
  if (action === 'leaveCircle') {
    const circleId = event.circleId || ''
    const circle = await getCircleById(circleId)
    if (!circle) return { ok: false, error: '圈子不存在' }
    const members = (circle.memberOpenids || []).slice()
    const idx = members.indexOf(OPENID)
    if (idx >= 0) members.splice(idx, 1)
    if (members.length === 0) {
      await circles.doc(circleId).remove()
    } else {
      await circles.doc(circleId).update({ data: { memberOpenids: members } })
    }
    return { ok: true }
  }

  // 解散圈子：仅创建者可以，删除圈子及其全部活动
  if (action === 'dissolveCircle') {
    const circleId = event.circleId || ''
    const circle = await getCircleById(circleId)
    if (!circle) return { ok: false, error: '圈子不存在' }
    if (circle.creatorOpenid !== OPENID) {
      return { ok: false, error: '只有圈子的创建者才能解散圈子' }
    }
    // 删除圈内活动（分页清理，最多 500 条，防止误删其他数据）
    const activities = db.collection('activities')
    let removed = 0
    for (let i = 0; i < 5; i++) {
      const res = await activities.where({ circleId: circleId }).limit(100).get()
      if (!res.data.length) break
      for (let j = 0; j < res.data.length; j++) {
        await activities.doc(res.data[j]._id).remove()
        removed++
      }
    }
    await circles.doc(circleId).remove()
    return { ok: true, removed: removed }
  }

  // 圈子成员列表：只有圈子成员能看到彼此资料
  if (action === 'listUsers') {
    const circleId = event.circleId || ''
    if (!(await isMember(circleId, OPENID))) {
      return { ok: false, code: 'NEED_CIRCLE', error: '需要先加入圈子' }
    }
    const circle = await getCircleById(circleId)
    const memberOpenids = circle ? circle.memberOpenids || [] : []
    const memberDocs = []
    for (let i = 0; i < memberOpenids.length; i += 20) {
      const part = memberOpenids.slice(i, i + 20)
      const r = await users.where({ openid: _.in(part) }).limit(20).get()
      memberDocs.push.apply(memberDocs, r.data)
    }
    const list = memberDocs.map(function (u) {
      return {
        openid: u.openid,
        name: u.name || '微信用户',
        avatar: u.avatar || '',
        location: u.location || '',
        lat: u.lat || null,
        lng: u.lng || null
      }
    })
    return { ok: true, users: list }
  }

  if (action === 'save') {
    if (!(await textSafe(event.name, 1))) {
      return { ok: false, error: '昵称包含不适合的内容，请修改后重试' }
    }
    const patch = {}
    if (event.name) patch.name = String(event.name).slice(0, 30)
    if (event.avatar) patch.avatar = String(event.avatar)
    if (event.location) patch.location = String(event.location).slice(0, 50)
    if (typeof event.lat === 'number') patch.lat = event.lat
    if (typeof event.lng === 'number') patch.lng = event.lng
    patch.updatedAt = db.serverDate()

    const exist = await users.where({ openid: OPENID }).limit(1).get()
    if (exist.data.length > 0) {
      await users.doc(exist.data[0]._id).update({ data: patch })
    } else {
      await users.add({
        data: Object.assign({ openid: OPENID, createdAt: db.serverDate() }, patch)
      })
    }
  }

  if (action === 'markSubscribed') {
    const exist = await users.where({ openid: OPENID }).limit(1).get()
    if (exist.data.length > 0) {
      await users.doc(exist.data[0]._id).update({
        data: { subscribed: true, subscribedAt: db.serverDate() }
      })
    }
    return { ok: true }
  }

  const res = await users.where({ openid: OPENID }).limit(1).get()
  return { ok: true, openid: OPENID, user: res.data[0] || null }
}
