// 项目配置：优先读取本机私有配置 config.local.js（已 git 忽略），否则使用占位符
// 部署/运行前：复制 config.example.js 为 config.local.js 并填入真实值
const local = {}
try {
  Object.assign(local, require('./config.local.js'))
} catch (e) {
  // 本地配置文件不存在时使用占位符
}

module.exports = {
  CLOUD_ENV: local.CLOUD_ENV || 'your-cloud-env-id',
  // 订阅消息模板 ID：mp.weixin.qq.com → 功能 → 订阅消息 → 公共模板库 → 选用「活动提醒」类模板
  // 留空则通知功能停用
  SUBSCRIBE_TEMPLATE_ID: local.SUBSCRIBE_TEMPLATE_ID || ''
}
