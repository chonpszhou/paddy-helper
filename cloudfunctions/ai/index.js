const https = require('https')
const cloud = require('wx-server-sdk')

// ================= AI 调用说明 =================
// 使用微信「小程序成长计划」免费额度（10 亿 Token / 6 个月）。
// 云函数内通过 wx-server-sdk 的 cloud.ai() 调用，无需 API Key，
// 环境自动鉴权，且只有这种官方 SDK 方式才允许消耗成长计划免费额度。
// provider 用 hunyuan-v3：非资源点套餐可用，且只消耗成长计划免费额度。
// 模型用 hy3（在 CloudBase 控制台 → AI → 生文模型 开启后可用）。
// =================================================

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
  timeout: 300000 // 生图较慢（10~60 秒），建议云函数超时配置到 300 秒
})

const SYS = '你是「Paddy小助手」的好友聚会策划助手，擅长把周末安排得热气腾腾。回答只用简体中文，并且只输出严格 JSON，不输出任何多余文字。'

const TYPE_NAMES = {
  dinner: '聚餐',
  outdoor: '户外活动',
  group: '团体活动',
  trip: '旅行'
}

function buildPrompt(action, p) {
  if (action === 'plan') {
    const typeName = TYPE_NAMES[p.type] || '活动'
    const menuPart = (p.menuList && p.menuList.length)
      ? '可选的菜（只能从这些里选）：' + p.menuList.join('、')
      : '本活动不需要菜单。'
    return '用户想组织一场「' + typeName + '」，请帮他策划。\n' +
      '主题：' + (p.topic || '未填写') + '\n' +
      menuPart + '\n' +
      '请输出严格 JSON（不要输出其他内容）：\n' +
      '{"title":"10字以内的活动标题，亲切有趣","description":"40-60字的邀请文案，有温度、有画面感","menu":["6-10道菜名，仅当菜单可用时给出，否则空数组"],"tips":["3-5条给组织者的实用准备建议"]}'
  }
  if (action === 'trip') {
    return '用户想去旅行，请规划行程。\n' +
      '需求：' + (p.topic || '未填写') + '\n' +
      '请输出严格 JSON（不要输出其他内容）：\n' +
      '{"title":"行程主题，10字内","itinerary":[{"day":1,"title":"Day 1","items":[{"time":"09:00","content":"做什么"}]}],"budget":[{"item":"住宿","amount":600}],"tips":["3-4条出行建议"]}' +
      ' 天数按需求推断（1-7天），每天4-8条安排，时间用HH:mm格式。'
  }
  if (action === 'summary') {
    return '请根据以下活动信息，写一段温暖、有画面感的活动小记，适合发朋友圈。\n' +
      '标题：' + p.title + '\n' +
      '类型：' + (TYPE_NAMES[p.type] || '活动') + '\n' +
      '时间：' + p.time + '\n地点：' + p.location + '\n' +
      '参加的人：' + p.participants + '\n' +
      '大家的留言：' + p.comments + '\n' +
      '照片里的高光：' + p.photoInfo + '\n' +
      '请输出严格 JSON：{"text":"100-150字的温暖小记"}'
  }
  if (action === 'group') {
    return '用户想组织团体活动，请推荐玩法。\n' +
      '需求：' + (p.topic || '未填写') + '\n' +
      '请输出严格 JSON（不要输出其他内容）：\n' +
      '{"suggestions":[{"name":"玩法或店型名称","category":"剧本杀/桌游/狼人杀/密室/其他","duration":"预计时长","budget":"人均预算区间","reason":"一句话推荐理由"}],"tips":["2-3条组织建议"]}' +
      ' 推荐2-4个方案。'
  }
  return ''
}

function parseJSON(text) {
  let t = String(text || '').trim()
  t = t.replace(/^```(json)?\s*/i, '').replace(/```\s*$/, '').trim()
  try {
    return JSON.parse(t)
  } catch (e) {
    const start = t.indexOf('{')
    const end = t.lastIndexOf('}')
    if (start >= 0 && end > start) {
      return JSON.parse(t.substring(start, end + 1))
    }
    throw new Error('AI 返回内容解析失败')
  }
}

// 生图接口返回临时 URL（24 小时有效），下载后转存到云存储，供海报画布长期使用
function downloadToBuffer(url) {
  return new Promise(function (resolve, reject) {
    https.get(url, function (res) {
      if (res.statusCode !== 200) {
        reject(new Error('图片下载失败 HTTP ' + res.statusCode))
        return
      }
      const chunks = []
      res.on('data', function (c) { chunks.push(c) })
      res.on('end', function () { resolve(Buffer.concat(chunks)) })
    }).on('error', function (e) {
      reject(new Error('图片下载失败：' + e.message))
    })
  })
}

// 文本安全校验：接口不可用时放行，仅在有明确风险时拦截
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
    console.error('[security] AI 内容安全检测失败', e)
    return true
  }
}

exports.main = async (event) => {
  const action = event && event.action
  if (!action) {
    return { ok: false, error: 'unknown action' }
  }
  try {
    // 生图：AI 生成海报背景图
    if (action === 'image') {
      const prompt = String(event.prompt || '').trim().slice(0, 200)
      if (!prompt) {
        return { ok: false, error: '先描述一下想要的背景风格吧' }
      }
      if (!(await textSafe(prompt, 1))) {
        return { ok: false, error: '描述包含不适合的内容，换个说法试试' }
      }
      const ai = cloud.ai()
      const imageModel = ai.createImageModel('hunyuan-image')
      const imgRes = await imageModel.generateImage({
        model: 'HY-Image-3.0-Plus-4090-Tob-v1.0',
        prompt: '一张适合周末聚会活动海报的精致插画背景，' + prompt + '，色彩柔和高级，中央留出大面积空白放文字',
        size: '1024x1024'
      })
      const url = imgRes && imgRes.data && imgRes.data[0] && imgRes.data[0].url
      if (!url) {
        return { ok: false, error: '生图失败，请稍后重试' }
      }
      const buffer = await downloadToBuffer(url)
      const up = await cloud.uploadFile({
        cloudPath: 'posters/' + Date.now() + '-' + Math.floor(Math.random() * 10000) + '.png',
        fileContent: buffer
      })
      return { ok: true, data: { fileID: up.fileID } }
    }

    if (['plan', 'trip', 'summary', 'group'].indexOf(action) < 0) {
      return { ok: false, error: 'unknown action' }
    }
    if (!(await textSafe(String(event.topic || ''), 1))) {
      return { ok: false, error: '输入的内容包含不适合的元素，换个说法试试' }
    }
    const prompt = buildPrompt(action, event)
    const ai = cloud.ai()
    const model = ai.createModel('hunyuan-v3')
    const result = await model.generateText({
      model: 'hy3',
      messages: [
        { role: 'system', content: SYS },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8
    })
    const content = (result && result.text) || ''
    if (!(await textSafe(content, 2))) {
      return { ok: false, error: '生成内容未通过安全审核，换个说法试试' }
    }
    const data = parseJSON(content)
    return { ok: true, data: data }
  } catch (e) {
    return { ok: false, error: (e && e.message) || 'AI 生成失败，请稍后再试' }
  }
}
