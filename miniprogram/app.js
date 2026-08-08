const store = require('./utils/store')

const CLOUD_ENV = 'your-cloud-env-id'

App({
  cloudEnv: CLOUD_ENV,
  onLaunch() {
    store.ensureSeed()
    if (wx.cloud) {
      try {
        wx.cloud.init({
          env: CLOUD_ENV,
          traceUser: true
        })
      } catch (e) {
        console.error('[cloud] 初始化失败', e)
      }
    }
    const profile = store.getProfile()
    if (profile.openid && profile.currentCircleId) {
      store.pullActivities(function () {
        store.syncLocalToCloud()
      })
      store.pullUsers()
    }
  },
  onShow() {
    // 不做强制登录：未登录用户也可以先浏览，用到登录身份时再引导
  }
})
