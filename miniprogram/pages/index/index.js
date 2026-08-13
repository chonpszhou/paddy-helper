const store = require('../../utils/store')
const helpers = require('../../utils/helpers')
const icons = require('../../utils/icons')

function decorate(activity) {
  const meta = store.TYPE_META[activity.type] || { name: '活动', color: '#6B7280', grad: 'linear-gradient(135deg, #9AA3AF, #D3D8DF)' }
  const profile = store.getProfile()
  const uid = store.currentUid()
  const parts = helpers.countdownParts(activity.startTime)
  const avatars = (activity.signups || [])
    .filter(function (s) { return s.status === 'yes' })
    .map(function (s) {
      let f = null
      if (s.friendId === uid) {
        f = { name: profile.name || '朋友', color: '#00E5A0' }
      } else {
        f = store.getFriend(s.friendId) || store.getCachedUser(s.friendId)
      }
      if (!f) return null
      return { letter: f.name ? f.name.charAt(0) : '友', color: f.color || '#D3D8DF' }
    })
    .filter(function (x) { return x !== null })
  return Object.assign({}, activity, {
    typeName: meta.name,
    typeIcon: icons.typeIcon(activity.type, meta.color),
    typeIconW: icons.typeIcon(activity.type, '#FFFFFF'),
    color: meta.color,
    grad: meta.grad,
    timeText: helpers.formatDateTime(activity.startTime),
    countdownText: helpers.countdownText(activity.startTime),
    countdownKind: parts ? parts.kind : '',
    confirmed: store.countConfirmed(activity),
    myStatusText: store.myStatusText(activity),
    avatars: avatars.slice(0, 5).map(function (a, i) { return Object.assign({ k: i }, a) }),
    avatarMore: Math.max(0, avatars.length - 5)
  })
}

Page({
  data: {
    greeting: '',
    profile: {},
    circleName: '',
    filter: 'all',
    stats: { upcoming: 0, joined: 0, types: 0 },
    feature: null,
    others: [],
    icons: {
      clock: icons.icon('clock', '#8B95A7'),
      pin: icons.icon('pin', '#8B95A7'),
      chevR: icons.icon('chevR', '#7C8698')
    }
  },

  onShow() {
    const profile = store.getProfile()
    const circle = store.getCurrentCircle()
    this.setData({ circleName: circle ? circle.name : '' })
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 })
    }
    this.refresh()
    const self = this
    if (profile.openid) {
      store.pullActivities(function () {
        self.refresh()
      })
      store.pullUsers()
    }
  },

  onPullDownRefresh() {
    const self = this
    const profile = store.getProfile()
    this.refresh()
    if (profile.openid) {
      store.pullActivities(function () {
        self.refresh()
        wx.stopPullDownRefresh()
      })
      store.pullUsers()
    } else {
      wx.stopPullDownRefresh()
    }
  },

  refresh() {
    const profile = store.getProfile()
    const upcoming = store.getUpcoming()
    const filter = this.data.filter
    const list = filter === 'all' ? upcoming : upcoming.filter(function (a) { return a.type === filter })
    const decorated = list.map(decorate)
    const typeSet = {}
    upcoming.forEach(function (a) { typeSet[a.type] = true })
    const stats = {
      upcoming: upcoming.length,
      joined: store.getMySignups().length,
      types: Object.keys(typeSet).length
    }
    this.setData({
      greeting: helpers.greeting(),
      profile: profile,
      displayName: profile.name || '朋友',
      noCircle: !profile.currentCircleId,
      stats: stats,
      feature: decorated[0] || null,
      others: decorated.slice(1)
    })
  },

  goCircle() {
    wx.navigateTo({
      url: '/pages/circle/circle'
    })
  },

  setFilter(e) {
    const self = this
    this.setData({
      filter: e.currentTarget.dataset.filter
    }, function () {
      self.refresh()
    })
  },

  goDetail(e) {
    wx.navigateTo({
      url: '/pages/activity/detail/detail?id=' + e.currentTarget.dataset.id
    })
  },

  goList() {
    wx.navigateTo({
      url: '/pages/activity/list/list'
    })
  },

  onShareAppMessage() {
    return {
      title: 'Paddy小助手 · 这周末，约起来 🫧',
      path: '/pages/index/index'
    }
  },

  onShareTimeline() {
    return {
      title: 'Paddy小助手 · 和朋友们把周末过得热气腾腾'
    }
  }

})
