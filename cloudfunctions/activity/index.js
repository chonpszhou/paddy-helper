const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const activities = db.collection('activities')
const users = db.collection('users')
const circles = db.collection('circles')

// ★ 订阅消息模板 ID：从云函数「配置 → 环境变量」读取 SUBSCRIBE_TEMPLATE_ID
// 部署前请在云开发控制台 → 云函数 → activity → 配置 → 环境变量 中添加：
//   SUBSCRIBE_TEMPLATE_ID = 你的模板ID
// 留空则通知功能停用（当前线上已部署的版本不受影响）
const SUBSCRIBE_TEMPLATE_ID = process.env.SUBSCRIBE_TEMPLATE_ID || ''

// ★ 模板字段映射：改成你模板里对应的 key（在「我的模板」里能看到，形如 thing1.DATA / time2.DATA）
// 默认按最常见的「活动名称 thing1 / 活动时间 time2 / 活动地点 thing3」配置
const TEMPLATE_FIELDS = {
  name: 'thing1',
  time: 'time2',
  location: 'thing3'
}

function fmtTime(ts) {
  if (!ts) return '尽快安排'
  const d = new Date(ts)
  const pad = function (n) { return n < 10 ? '0' + n : '' + n }
  return d.getFullYear() + '年' + pad(d.getMonth() + 1) + '月' + pad(d.getDate()) + '日 ' + pad(d.getHours()) + ':' + pad(d.getMinutes())
}

// 订阅消息 thing 字段不支持表情/特殊字符：去掉后取前 20 字
function cleanThing(text) {
  return String(text || '')
    .replace(/[\uD800-\uDFFF]/g, '')   // 去掉表情等增补平面字符
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, 20)
}

async function isMember(circleId, openid) {
  if (!circleId) return false
  try {
    const res = await circles.doc(circleId).get()
    const c = res.data
    return !!(c && (c.memberOpenids || []).indexOf(openid) >= 0)
  } catch (e) {
    return false
  }
}

// 创建活动后，给已授权订阅消息的好友推送一条「新活动提醒」
async function notifyCreation(activity, creatorOpenid, docId) {
  if (!SUBSCRIBE_TEMPLATE_ID) return
  try {
    const res = await users.where({ subscribed: true }).limit(100).get()
    let receivers = res.data.filter(function (u) {
      return u.openid && u.openid !== creatorOpenid
    })
    // 只通知本圈子的成员
    try {
      const circle = await circles.doc(activity.circleId || '').get()
      const memberOpenids = (circle.data && circle.data.memberOpenids) || []
      receivers = receivers.filter(function (u) {
        return memberOpenids.indexOf(u.openid) >= 0
      })
    } catch (e) {
      receivers = []
    }
    // 若创建时勾选了邀请对象且能对应到真实账号，只通知被邀请的人；
    // 否则（好友还没绑定账号）通知所有已授权的好友
    const invited = activity.invitedOpenids || []
    if (invited.length) {
      receivers = receivers.filter(function (u) {
        return invited.indexOf(u.openid) >= 0
      })
    }
    const page = 'pages/activity/detail/detail?cid=' + (docId || '')
    const data = {}
    data[TEMPLATE_FIELDS.name] = { value: cleanThing(activity.title) || '新活动' }
    data[TEMPLATE_FIELDS.time] = { value: fmtTime(activity.startTime).slice(0, 20) }
    data[TEMPLATE_FIELDS.location] = { value: cleanThing(activity.location) || '地点待定' }
    for (let i = 0; i < receivers.length; i++) {
      try {
        await cloud.openapi.subscribeMessage.send({
          touser: receivers[i].openid,
          templateId: SUBSCRIBE_TEMPLATE_ID,
          page: page,
          data: data
        })
      } catch (e) {
        console.error('[notify] 发送订阅消息失败', receivers[i].openid, e)
      }
    }
  } catch (e) {
    console.error('[notify] 查询订阅用户失败', e)
  }
}

// 文本安全校验：内容安全接口不可用时放行，仅在有明确风险时拦截
async function textSafe(content, scene) {
  if (!content || typeof content !== 'string') return true
  const text = content.trim()
  if (!text || text.length > 2500) return true
  try {
    const { OPENID } = cloud.getWXContext()
    const res = await cloud.openapi.security.msgSecCheck({
      version: 2,
      scene: scene || 2,
      openid: OPENID,
      content: text
    })
    const suggest = res && res.result && res.result.suggest
    return suggest !== 'risky'
  } catch (e) {
    console.error('[security] msgSecCheck 失败', e)
    return true
  }
}

function stripUndefined(obj) {
  const clean = {}
  Object.keys(obj).forEach(function (k) {
    if (obj[k] !== undefined) clean[k] = obj[k]
  })
  return clean
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const action = event && event.action ? event.action : ''

  const circleId = event.circleId || ''
  if (!(await isMember(circleId, OPENID))) {
    return { ok: false, code: 'NEED_CIRCLE', error: '需要先加入圈子才能访问' }
  }

  if (action === 'list') {
    const res = await activities.where({ circleId: circleId }).orderBy('createdAt', 'desc').limit(200).get()
    return { ok: true, activities: res.data }
  }

  if (action === 'save') {
    const activity = event.activity || {}
    if (!(await textSafe(activity.title, 1))) {
      return { ok: false, error: '活动标题包含不适合发布的内容，请修改后重试' }
    }
    if (!(await textSafe(activity.description, 1))) {
      return { ok: false, error: '活动介绍包含不适合发布的内容，请修改后重试' }
    }
    const comments = activity.comments || []
    for (let i = 0; i < comments.length; i++) {
      if (!(await textSafe(comments[i] && comments[i].text, 2))) {
        return { ok: false, error: '留言包含不适合发布的内容，请修改后重试' }
      }
    }
    const localId = event.localId || activity.localId || ''
    const clean = stripUndefined(activity)
    delete clean._id
    delete clean._openid
    delete clean.cloudId
    clean.circleId = circleId
    clean.updatedAt = db.serverDate()

    if (activity._id) {
      await activities.doc(activity._id).set({ data: clean })
      return { ok: true, _id: activity._id }
    }

    const exist = localId ? await activities.where({ localId: localId }).limit(1).get() : { data: [] }
    if (exist.data.length > 0) {
      const docId = exist.data[0]._id
      // 保留 localId，避免后续推送因找不到原文档而重复创建
      clean.localId = localId
      await activities.doc(docId).set({ data: clean })
      return { ok: true, _id: docId }
    }

    clean.localId = localId
    clean.creatorOpenid = OPENID
    const add = await activities.add({ data: clean })
    await notifyCreation(clean, OPENID, add._id)
    return { ok: true, _id: add._id }
  }

  if (action === 'remove') {
    let cloudId = event.cloudId || ''
    const activityId = event.activityId || ''
    let target = null
    if (cloudId) {
      const doc = await activities.doc(cloudId).get()
      target = doc.data
    } else if (activityId) {
      const exist = await activities.where({ localId: activityId }).limit(1).get()
      if (exist.data.length > 0) {
        target = exist.data[0]
        cloudId = exist.data[0]._id
      }
    }
    if (target && target.creatorOpenid && target.creatorOpenid !== OPENID) {
      return { ok: false, error: '仅发起人可以删除活动' }
    }
    if (cloudId) {
      await activities.doc(cloudId).remove()
    }
    return { ok: true }
  }

  return { ok: false, error: 'unknown action' }
}
