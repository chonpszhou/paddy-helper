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
      if (fid === store.currentUid()) return profile.name || '朋友'
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
    let menuCount = 0
    privateMenu.PRIVATE_MENU.forEach(function (cat) { menuCount += cat.dishes.length })
    const names = {}
    ;(dinner.dishes || []).forEach(function (x) { names[x.name] = true })
    let menuAddedCount = 0
    privateMenu.PRIVATE_MENU.forEach(function (cat) {
      cat.dishes.forEach(function (dish) {
        if (names[dish.name]) menuAddedCount++
      })
    })
    const menuAdded = menuAddedCount === menuCount
    const menuDishes = home ? privateMenu.PRIVATE_MENU.map(function (cat) {
      return {
        icon: cat.icon,
        cat: cat.cat,
        dishes: cat.dishes.map(function (dish) {
          return Object.assign({}, dish, { added: !!names[dish.name] })
        })
      }
    }) : []

    // 🔥 人气推荐：最受欢迎的时间段 + 人气菜品（纯数据统计）
    let hotSlot = ''
    let hotSlotCount = 0
    dinner.timeSlots.forEach(function (s) {
      if (s.votes.length > hotSlotCount) {
        hotSlotCount = s.votes.length
        hotSlot = s.label
      }
    })
    const hotDishes = dinner.dishes.slice()
      .sort(function (a, b) { return b.voters.length - a.voters.length })
      .slice(0, 3)
      .map(function (d) { return d.name })

    this.setData({
      activity: activity,
      timeText: helpers.formatDateTime(activity.startTime),
      slots: slots,
      dishes: dishes,
      bringItems: bringItems,
      homeDinner: homeDinner,
      shoppingList: dishes.filter(function (d) { return !d.covered }),
      isPaddyHome: home,
      privateMenu: menuDishes,
      menuCount: menuCount,
      privateMenuAdded: menuAdded,
      privateMenuRemaining: Math.max(0, menuCount - menuAddedCount),
      hotSlotText: hotSlot,
      hotSlotCount: hotSlotCount,
      hotDishText: hotDishes.join(' · ')
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

  togglePrivateDish(e) {
    const name = (e.currentTarget.dataset.name || '').trim()
    if (!name) return
    if (store.addPrivateDish(this.data.id, name)) {
      this.refresh()
      wx.showToast({ title: '「' + name + '」已加入菜单 🎉', icon: 'none' })
    } else {
      wx.showToast({ title: '这道菜已经在菜单里啦', icon: 'none' })
    }
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
