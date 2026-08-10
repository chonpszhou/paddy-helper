const store = require('../../utils/store')
const helpers = require('../../utils/helpers')

Page({
  data: {
    id: '',
    activity: null,
    timeText: '',
    days: [],
    tasks: [],
    stays: [],
    expenses: [],
    total: 0,
    perPersonText: '0',
    aaCount: 0,
    newStayName: '',
    newStayCost: '',
    newStayNights: '1',
    newExpenseItem: '',
    newExpenseAmount: ''
  },

  onLoad(options) {
    this.setData({ id: options.id })
  },

  onShow() {
    this.refresh()
  },

  refresh() {
    const activity = store.getActivity(this.data.id)
    if (!activity) return
    const trip = activity.trip || { days: [], tasks: [], stays: [], expenses: [] }
    const profile = store.getProfile()

    const nameOf = function (fid) {
      if (fid === store.currentUid()) return profile.name
      const f = store.getFriend(fid) || store.getCachedUser(fid)
      return f ? f.name : '朋友'
    }
    const emojiOf = function (fid) {
      if (fid === store.currentUid()) return '👨‍🍳'
      const f = store.getFriend(fid) || store.getCachedUser(fid)
      return f ? f.emoji : '🙂'
    }
    const uid = store.currentUid()

    const days = trip.days.map(function (day) {
      return {
        id: day.id,
        title: day.title,
        items: (day.items || []).map(function (it) {
          return { id: it.id, time: it.time, content: it.content }
        })
      }
    })

    const tasks = trip.tasks.map(function (t) {
      let statusText = '待认领'
      let ownerEmoji = ''
      if (t.ownerId === uid) {
        statusText = '✅ 我认领'
        ownerEmoji = '👨‍🍳'
      } else if (t.ownerId) {
        statusText = '🙋 ' + nameOf(t.ownerId) + ' 认领'
        ownerEmoji = emojiOf(t.ownerId)
      }
      return {
        id: t.id,
        name: t.name,
        isMine: t.ownerId === uid,
        taken: !!t.ownerId,
        statusText: statusText,
        ownerEmoji: ownerEmoji
      }
    })

    const stays = trip.stays.map(function (s) {
      const cost = Number(s.cost) || 0
      const nights = Number(s.nights) || 1
      return {
        id: s.id,
        name: s.name,
        cost: cost,
        nights: nights,
        total: cost * nights,
        ownerName: nameOf(s.ownerId),
        ownerEmoji: emojiOf(s.ownerId),
        isMine: s.ownerId === uid
      }
    })

    const expenses = trip.expenses.map(function (e) {
      return {
        id: e.id,
        item: e.item,
        amount: Number(e.amount) || 0,
        payerName: nameOf(e.payerId),
        payerEmoji: emojiOf(e.payerId),
        isMine: e.payerId === uid
      }
    })

    const total = expenses.reduce(function (n, e) { return n + e.amount }, 0)
    const aaCount = (activity.signups || []).filter(function (s) { return s.status === 'yes' }).length
    const perPerson = aaCount > 0 ? total / aaCount : 0

    this.setData({
      activity: activity,
      timeText: helpers.formatDateTime(activity.startTime),
      days: days,
      tasks: tasks,
      stays: stays,
      expenses: expenses,
      total: total,
      aaCount: aaCount,
      perPersonText: aaCount > 0 ? perPerson.toFixed(1) : '0'
    })
  },

  addDay() {
    const self = this
    wx.showModal({
      title: '添加一天',
      editable: true,
      placeholderText: '比如：Day 3 · 周一',
      success(res) {
        if (res.confirm) {
          store.addTripDay(self.data.id, res.content)
          self.refresh()
        }
      }
    })
  },

  addItem(e) {
    const self = this
    const dayId = e.currentTarget.dataset.dayId
    wx.showModal({
      title: '添加安排',
      editable: true,
      placeholderText: '比如：09:30 集合出发',
      success(res) {
        if (!res.confirm) return
        const text = (res.content || '').trim()
        if (!text) return
        const m = text.match(/^(\d{1,2}:\d{2})\s*(.*)$/)
        const time = m ? m[1] : '全天'
        const content = m ? m[2] : text
        if (!content) {
          wx.showToast({ title: '写点安排内容吧', icon: 'none' })
          return
        }
        store.addTripItem(self.data.id, dayId, time, content)
        self.refresh()
      }
    })
  },

  removeItem(e) {
    const self = this
    const dayId = e.currentTarget.dataset.dayId
    const itemId = e.currentTarget.dataset.itemId
    wx.showModal({
      title: '删除安排',
      content: '确定删除这条安排吗？',
      confirmColor: '#FF4D4F',
      success(res) {
        if (res.confirm) {
          store.removeTripItem(self.data.id, dayId, itemId)
          self.refresh()
        }
      }
    })
  },

  toggleTask(e) {
    store.toggleTaskOwner(this.data.id, e.currentTarget.dataset.taskId)
    this.refresh()
  },

  addTask() {
    const self = this
    wx.showModal({
      title: '添加分工',
      editable: true,
      placeholderText: '比如：订门票',
      success(res) {
        if (res.confirm) {
          store.addTask(self.data.id, res.content)
          self.refresh()
        }
      }
    })
  },

  onStayName(e) { this.setData({ newStayName: e.detail.value }) },
  onStayCost(e) { this.setData({ newStayCost: e.detail.value }) },
  onStayNights(e) { this.setData({ newStayNights: e.detail.value }) },

  addStay() {
    const name = this.data.newStayName.trim()
    if (!name) {
      wx.showToast({ title: '填个名称吧', icon: 'none' })
      return
    }
    store.addStay(this.data.id, {
      name: name,
      cost: this.data.newStayCost,
      nights: this.data.newStayNights
    })
    this.setData({ newStayName: '', newStayCost: '', newStayNights: '1' })
    this.refresh()
    wx.showToast({ title: '登记成功 🎉', icon: 'success' })
  },

  removeStay(e) {
    const self = this
    const stayId = e.currentTarget.dataset.stayId
    wx.showModal({
      title: '删除住宿',
      content: '确定删除这条住宿记录吗？',
      confirmColor: '#FF4D4F',
      success(res) {
        if (res.confirm) {
          store.removeStay(self.data.id, stayId)
          self.refresh()
        }
      }
    })
  },

  onExpenseItem(e) { this.setData({ newExpenseItem: e.detail.value }) },
  onExpenseAmount(e) { this.setData({ newExpenseAmount: e.detail.value }) },

  addExpense() {
    const item = this.data.newExpenseItem.trim()
    const amount = Number(this.data.newExpenseAmount)
    if (!item) {
      wx.showToast({ title: '写个项目吧', icon: 'none' })
      return
    }
    if (!this.data.newExpenseAmount || isNaN(amount) || amount <= 0) {
      wx.showToast({ title: '填个金额吧', icon: 'none' })
      return
    }
    store.addExpense(this.data.id, { item: item, amount: amount })
    this.setData({ newExpenseItem: '', newExpenseAmount: '' })
    this.refresh()
    wx.showToast({ title: '已记账 💰', icon: 'success' })
  },

  removeExpense(e) {
    const self = this
    const expenseId = e.currentTarget.dataset.expenseId
    wx.showModal({
      title: '删除记录',
      content: '确定删除这笔账吗？',
      confirmColor: '#FF4D4F',
      success(res) {
        if (res.confirm) {
          store.removeExpense(self.data.id, expenseId)
          self.refresh()
        }
      }
    })
  },

  openLocation() {
    const a = this.data.activity
    helpers.openMap(a.title, a.location, a.locationLat, a.locationLng)
  },

  goBack() {
    wx.navigateBack({
      fail() {
        wx.switchTab({ url: '/pages/index/index' })
      }
    })
  }
})
