const store = require('../../../utils/store')
const helpers = require('../../../utils/helpers')
const icons = require('../../../utils/icons')

function decorate(activity) {
  const meta = store.TYPE_META[activity.type] || { name: '活动', icon: '📌', color: '#6B7280', grad: 'linear-gradient(135deg, #9AA3AF, #D3D8DF)' }
  const parts = helpers.countdownParts(activity.startTime)
  return Object.assign({}, activity, {
    typeName: meta.name,
    typeIcon: icons.typeIcon(activity.type, meta.color),
    color: meta.color,
    grad: meta.grad,
    timeText: helpers.formatDateTime(activity.startTime),
    countdownText: helpers.countdownText(activity.startTime),
    countdownKind: parts ? parts.kind : '',
    confirmed: store.countConfirmed(activity)
  })
}

Page({
  data: {
    tab: 'all',
    activities: []
  },

  onShow() {
    this.refresh()
  },

  onPullDownRefresh() {
    const self = this
    this.refresh()
    const profile = store.getProfile()
    if (profile.openid) {
      store.pullActivities(function () {
        self.refresh()
        wx.stopPullDownRefresh()
      })
    } else {
      wx.stopPullDownRefresh()
    }
  },

  refresh() {
    let list
    if (this.data.tab === 'all') {
      list = store.getUpcoming().concat(store.getEnded())
    } else {
      list = this.data.tab === 'ongoing' ? store.getUpcoming() : store.getEnded()
    }
    this.setData({
      activities: list.map(decorate)
    })
  },

  switchTab(e) {
    this.setData({
      tab: e.currentTarget.dataset.tab
    }, () => this.refresh())
  },

  goDetail(e) {
    wx.navigateTo({
      url: '/pages/activity/detail/detail?id=' + e.currentTarget.dataset.id
    })
  },

  goCreate() {
    wx.switchTab({
      url: '/pages/activity/create/create'
    })
  }
})
