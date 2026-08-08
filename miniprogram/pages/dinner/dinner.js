const store = require('../../utils/store')
const helpers = require('../../utils/helpers')
const privateMenu = require('../../utils/private-menu')

Page({
  data: {
    id: '',
    activity: null,
    timeText: '',
    slots: [],
    dishes: [],
    bringItems: [],
    shoppingList: [],
    myBringItem: '',
    isPaddyHome: false,
    privateMenu: [],
    menuCount: 0,
    privateMenuAdded: false
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
    const dinner = activity.dinner || { timeSlots: [], dishes: [], bringItems: [] }
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
    const colorOf = function (fid) {
      if (fid === store.currentUid()) return '#07C160'
      const f = store.getFriend(fid) || store.getCachedUser(fid)
      return f ? f.color : '#D9CFC4'
    }
    const uid = store.currentUid()

    const slots = dinner.timeSlots.map(function (s) {
      return {
        id: s.id,
        label: s.label,
        votedCount: s.votes.length,
        voted: s.votes.indexOf(uid) >= 0,
        voters: s.votes.slice(0, 6).map(emojiOf)
      }
    })

    const dishes = dinner.dishes.map(function (d) {
      return {
        id: d.id,
        name: d.name,
        wantCount: d.voters.length,
        wanted: d.voters.indexOf(uid) >= 0,
        covered: dinner.bringItems.some(function (it) {
          return d.name.indexOf(it.item) >= 0 || it.item.indexOf(d.name) >= 0
        })
      }
    })

    const bringItems = dinner.bringItems.map(function (it) {
      return {
        id: it.id,
        item: it.item,
        friendId: it.friendId,
        name: nameOf(it.friendId),
        emoji: emojiOf(it.friendId),
        color: colorOf(it.friendId),
        isMine: it.friendId === uid
      }
    })

    const home = store.isPaddyHome(activity.location)
    const homeDinner = activity.dinnerMode !== 'restaurant'
    let menuAdded = false
    if (home) {
      const names = {}
      ;(dinner.dishes || []).forEach(function (x) { names[x.name] = true })
      menuAdded = privateMenu.PRIVATE_MENU.every(function (cat) {
        return cat.dishes.every(function (dish) { return names[dish.name] })
      })
    }
    let menuCount = 0
    privateMenu.PRIVATE_MENU.forEach(function (cat) { menuCount += cat.dishes.length })

    this.setData({
      activity: activity,
      timeText: helpers.formatDateTime(activity.startTime),
      slots: slots,
      dishes: dishes,
      bringItems: bringItems,
      homeDinner: homeDinner,
      shoppingList: dishes.filter(function (d) { return !d.covered }),
      isPaddyHome: home,
      privateMenu: home ? privateMenu.PRIVATE_MENU : [],
      menuCount: menuCount,
      privateMenuAdded: menuAdded
    })
  },

  toggleTime(e) {
    store.toggleTimeVote(this.data.id, e.currentTarget.dataset.slotId)
    this.refresh()
  },

  addTimeSlot() {
    const self = this
    wx.showModal({
      title: '添加时间段',
      editable: true,
      placeholderText: '比如：周六 18:30',
      success(res) {
        if (res.confirm) {
          store.addTimeSlot(self.data.id, res.content)
          self.refresh()
        }
      }
    })
  },

  toggleDish(e) {
    store.toggleDishVote(this.data.id, e.currentTarget.dataset.dishId)
    this.refresh()
  },

  addDish() {
    const self = this
    wx.showModal({
      title: '加菜',
      editable: true,
      placeholderText: '比如：鹌鹑蛋',
      success(res) {
        if (res.confirm) {
          store.addDish(self.data.id, res.content)
          self.refresh()
        }
      }
    })
  },

  onBringInput(e) {
    this.setData({ myBringItem: e.detail.value })
  },

  addBring() {
    const item = this.data.myBringItem.trim()
    if (!item) {
      wx.showToast({ title: '写上带什么吧', icon: 'none' })
      return
    }
    store.addBringItem(this.data.id, item)
    this.setData({ myBringItem: '' })
    this.refresh()
    wx.showToast({ title: '登记成功 🎉', icon: 'success' })
  },

  addPrivateMenu() {
    const added = store.addPrivateMenuToDinner(this.data.id)
    this.refresh()
    wx.showToast({
      title: added > 0 ? '菜单已加入点菜，快选想吃的 🎉' : '菜单已经在点菜清单里啦',
      icon: 'none'
    })
  },

  removeBring(e) {
    store.removeBringItem(this.data.id, e.currentTarget.dataset.itemId)
    this.refresh()
    wx.showToast({ title: '已取消', icon: 'none' })
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
