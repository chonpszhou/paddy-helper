const store = require('../../utils/store')
const helpers = require('../../utils/helpers')
const icons = require('../../utils/icons')
const config = require('../../utils/config')

Page({
  data: {
    profile: {},
    avatarLetter: '',
    myActivities: [],
    stats: { created: 0, joined: 0, maybe: 0, upcoming: 0 },
    manageCount: 0,
    version: 'v1.0'
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 })
    }
    this.refresh()
  },

  refresh() {
    const profile = store.getProfile()
    const circle = store.getCurrentCircle()
    const manageCount = store.getActivities().length
    const myActivities = store.getMySignups().map(function (a) {
      const meta = store.TYPE_META[a.type] || { name: '活动', icon: '📌', color: '#6B7280', grad: 'linear-gradient(135deg, #9AA3AF, #D3D8DF)' }
      const my = store.mySignup(a)
      const parts = helpers.countdownParts(a.startTime)
      return {
        id: a.id,
        title: a.title,
        typeName: meta.name,
        typeIcon: icons.typeIcon(a.type, meta.color),
        color: meta.color,
        grad: meta.grad,
        timeText: helpers.formatDateTime(a.startTime),
        countdownText: helpers.countdownText(a.startTime),
        countdownKind: parts ? parts.kind : '',
        myStatusText: store.SIGNUP_META[my.status] ? store.SIGNUP_META[my.status].icon + ' ' + store.SIGNUP_META[my.status].label : ''
      }
    })
    this.setData({
      profile: profile,
      circleName: circle ? circle.name : '',
      avatarLetter: profile.name ? profile.name.charAt(0) : 'P',
      manageCount: manageCount,
      stats: store.countMyStats(),
      myActivities: myActivities
    })
  },

  goLogin() {
    wx.navigateTo({
      url: '/pages/login/login'
    })
  },

  goManage() {
    wx.navigateTo({
      url: '/pages/activity/manage/manage'
    })
  },

  goFriends() {
    wx.navigateTo({
      url: '/pages/friends/friends'
    })
  },

  goPrivacy() {
    wx.navigateTo({
      url: '/pages/privacy/privacy'
    })
  },

  editLocation() {
    const self = this
    helpers.chooseMapLocation(function (loc) {
      store.updateProfile({
        location: loc.name || loc.address,
        lat: loc.lat,
        lng: loc.lng
      })
      store.syncProfileToCloud()
      self.refresh()
    })
  },

  manageCircle() {
    wx.navigateTo({
      url: '/pages/circle/circle'
    })
  },

  enableNotify() {
    const profile = store.getProfile()
    if (!profile.openid) {
      wx.showToast({ title: '先登录才能开启通知', icon: 'none' })
      return
    }
    if (!config.SUBSCRIBE_TEMPLATE_ID || !wx.requestSubscribeMessage) {
      wx.showToast({ title: '通知功能暂未启用', icon: 'none' })
      return
    }
    wx.requestSubscribeMessage({ tmplIds: [config.SUBSCRIBE_TEMPLATE_ID] })
      .then(function (res) {
        if (res[config.SUBSCRIBE_TEMPLATE_ID] === 'accept') {
          store.markSubscribed(profile.openid)
          wx.showToast({ title: '已开启活动通知 🔔', icon: 'success' })
        } else {
          wx.showToast({ title: '未开启，随时可以再来', icon: 'none' })
        }
      })
      .catch(function () {
        wx.showToast({ title: '授权失败，请重试', icon: 'none' })
      })
  },

  goDetail(e) {
    wx.navigateTo({
      url: '/pages/activity/detail/detail?id=' + e.currentTarget.dataset.id
    })
  },

  resetDemo() {
    const self = this
    wx.showModal({
      title: '恢复演示数据',
      content: '会清空当前所有数据，恢复为初始示例，确定吗？',
      confirmColor: '#FF4D4F',
      success(res) {
        if (res.confirm) {
          store.resetDemo()
          self.refresh()
          wx.showToast({ title: '已恢复', icon: 'success' })
        }
      }
    })
  },

  onShareAppMessage() {
    return {
      title: 'Paddy小助手 · 和朋友们把周末过得热气腾腾',
      path: '/pages/index/index'
    }
  },

  onShareTimeline() {
    return {
      title: 'Paddy小助手 · 和朋友们把周末过得热气腾腾'
    }
  }
})
