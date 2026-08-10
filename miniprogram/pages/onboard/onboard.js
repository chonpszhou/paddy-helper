const store = require('../../utils/store')

Page({
  onLoad() {
    if (store.isOnboardDone()) {
      this.enterApp(false)
    }
  },

  start() {
    store.markOnboardDone()
    this.enterApp(true)
  },

  skip() {
    store.markOnboardDone()
    this.enterApp(false)
  },

  enterApp(needLogin) {
    const profile = store.getProfile()
    if (needLogin && !profile.openid) {
      wx.reLaunch({
        url: '/pages/login/login'
      })
      return
    }
    wx.switchTab({
      url: '/pages/index/index'
    })
  }
})
