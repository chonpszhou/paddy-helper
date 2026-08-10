const store = require('../../utils/store')

Page({
  data: {
    current: 0,
    total: 6,
    pages: [0, 1, 2, 3, 4, 5]
  },

  onLoad() {
    if (store.isOnboardDone()) {
      this.enterApp(false)
    }
  },

  onSwiper(e) {
    this.setData({ current: e.detail.current })
  },

  next() {
    if (this.data.current < this.data.total - 1) {
      this.setData({ current: this.data.current + 1 })
    } else {
      this.start()
    }
  },

  prev() {
    if (this.data.current > 0) {
      this.setData({ current: this.data.current - 1 })
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
