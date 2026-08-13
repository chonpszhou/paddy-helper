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
    isCreator: store.isCreator(activity),
    confirmed: store.countConfirmed(activity)
  })
}

Page({
  data: {
    tab: 'ongoing',
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
    const list = this.data.tab === 'ongoing' ? store.getUpcoming() : store.getEnded()
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
  },

  removeActivity(e) {
    const self = this
    const id = e.currentTarget.dataset.id
    const title = e.currentTarget.dataset.title
    wx.showModal({
      title: '删除活动',
      content: '确定删除「' + title + '」吗？只从你自己的列表移除，不影响其他朋友看到的数据。',
      confirmText: '删除',
      confirmColor: '#FF4D4F',
      success(res) {
        if (res.confirm) {
          store.removeActivity(id)
          self.refresh()
          wx.showToast({ title: '已删除', icon: 'success' })
        }
      }
    })
  },

  endActivity(e) {
    const self = this
    const id = e.currentTarget.dataset.id
    const title = e.currentTarget.dataset.title
    wx.showModal({
      title: '结束活动',
      content: '把「' + title + '」标记为已结束？它会移到「已结束」列表里，方便回顾。',
      confirmText: '结束',
      confirmColor: '#FF8A5B',
      success(res) {
        if (res.confirm) {
          store.markEnded(id)
          self.refresh()
          wx.showToast({ title: '已结束 🎉', icon: 'success' })
        }
      }
    })
  },

  duplicateActivity(e) {
    const self = this
    const id = e.currentTarget.dataset.id
    const title = e.currentTarget.dataset.title
    wx.showModal({
      title: '再来一场',
      content: '复制「' + title + '」的配置生成新活动（时间顺延一周，报名清空）？',
      confirmText: '生成',
      confirmColor: '#07C160',
      success(res) {
        if (!res.confirm) return
        const newId = store.duplicateActivity(id)
        if (!newId) {
          wx.showToast({ title: '复制失败，请重试', icon: 'none' })
          return
        }
        wx.showToast({ title: '已生成新活动 ✨', icon: 'success' })
        setTimeout(function () {
          wx.redirectTo({
            url: '/pages/activity/detail/detail?id=' + newId
          })
        }, 600)
      }
    })
  }
})
