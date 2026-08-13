const store = require('../../utils/store')

Page({
  data: {
    joinCode: '',
    newName: '',
    joinLoading: false,
    createLoading: false,
    error: '',
    created: false,
    createdName: '',
    createdCode: '',
    myCircles: [],
    currentCircleId: '',
    loggedIn: false
  },

  onLoad(options) {
    // 从分享链接进入时自动填入通行码
    if (options && options.code) {
      this.setData({
        joinCode: String(options.code).trim().toUpperCase()
      })
    }
    // 从发起页跳过来：创建/加入圈子后回到发起页继续填表
    this._fromCreate = !!(options && options.from === 'create') || !!wx.getStorageSync('create_return')
  },

  onShow() {
    const profile = store.getProfile()
    const current = store.getCurrentCircle()
    this.setData({
      myCircles: this.decorateCircles(store.getMyCircles()),
      currentCircleId: current ? current.id : '',
      loggedIn: !!profile.openid
    })
    const self = this
    // 从云端同步我加入过的圈子（多设备登录也能看到）
    store.pullMyCircles(function () {
      const cur = store.getCurrentCircle()
      self.setData({
        myCircles: self.decorateCircles(store.getMyCircles()),
        currentCircleId: cur ? cur.id : ''
      })
    })
  },

  decorateCircles(list) {
    const profile = store.getProfile()
    return (list || []).map(function (c) {
      return Object.assign({}, c, {
        isCreator: !!(profile.openid && c.creatorOpenid === profile.openid)
      })
    })
  },

  onJoinInput(e) {
    this.setData({ joinCode: e.detail.value, error: '' })
  },

  onNameInput(e) {
    this.setData({ newName: e.detail.value, error: '' })
  },

  doJoin() {
    console.log('[circle] 点击加入圈子')
    this.setData({ error: '' })
    const code = this.data.joinCode.trim().toUpperCase()
    if (!code) {
      wx.showToast({ title: '先输入圈子通行码', icon: 'none' })
      return
    }
    const self = this
    this.setData({ joinLoading: true })
    store.joinCircle(code, function (ok, circle, error) {
      self.setData({ joinLoading: false })
      if (ok) {
        const profile = store.getProfile()
        if (!profile.openid) {
          wx.showModal({
            title: '已加入「' + circle.name + '」🎉',
            content: '建议先登录（微信头像昵称），登录后朋友们才能认出你、活动才能云端同步。',
            confirmText: '去登录',
            cancelText: '稍后再说',
            success(res) {
              if (res.confirm) {
                wx.navigateTo({ url: '/pages/login/login' })
              } else if (self._fromCreate) {
                wx.removeStorageSync('create_return')
                wx.switchTab({ url: '/pages/activity/create/create' })
              } else {
                wx.reLaunch({ url: '/pages/index/index' })
              }
            }
          })
        } else {
          wx.showToast({ title: '已加入「' + circle.name + '」🎉', icon: 'success' })
          setTimeout(function () {
            if (self._fromCreate) {
              wx.removeStorageSync('create_return')
              wx.switchTab({ url: '/pages/activity/create/create' })
            } else {
              wx.reLaunch({ url: '/pages/index/index' })
            }
          }, 600)
        }
      } else {
        self.setData({ error: error || '加入失败' })
      }
    })
  },

  doCreate() {
    console.log('[circle] 点击创建圈子')
    this.setData({ error: '' })
    const name = this.data.newName.trim()
    if (!name) {
      wx.showToast({ title: '给圈子起个名字', icon: 'none' })
      return
    }
    const self = this
    this.setData({ createLoading: true })
    store.createCircle(name, function (ok, circle, error) {
      self.setData({ createLoading: false })
      if (ok) {
        self.setData({
          created: true,
          createdName: circle.name,
          createdCode: circle.code,
          newName: ''
        })
      } else {
        self.setData({ error: error || '创建失败' })
      }
    })
  },

  copyCode() {
    wx.setClipboardData({
      data: this.data.createdCode,
      success() {
        wx.showToast({ title: '已复制 ✨', icon: 'success' })
      }
    })
  },

  copyCircleCode(e) {
    const code = e.currentTarget.dataset.code
    if (!code) {
      wx.showToast({ title: '这个圈子没有通行码', icon: 'none' })
      return
    }
    wx.setClipboardData({
      data: code,
      success() {
        wx.showToast({ title: '通行码已复制 ✨', icon: 'success' })
      }
    })
  },

  enterCircle() {
    if (this._fromCreate) {
      wx.removeStorageSync('create_return')
      wx.switchTab({ url: '/pages/activity/create/create' })
    } else {
      wx.reLaunch({ url: '/pages/index/index' })
    }
  },

  goHome() {
    wx.removeStorageSync('create_return')
    wx.reLaunch({ url: '/pages/index/index' })
  },

  switchCircle(e) {
    const id = e.currentTarget.dataset.id
    if (id === this.data.currentCircleId) return
    const c = store.getMyCircles().find(function (x) { return x.id === id })
    if (!c) return
    store.setCurrentCircle(id)
    wx.showToast({ title: '已切换到「' + c.name + '」', icon: 'success' })
    setTimeout(function () {
      wx.reLaunch({ url: '/pages/index/index' })
    }, 600)
  },

  manageCircle(e) {
    const id = e.currentTarget.dataset.id
    const circle = store.getMyCircles().find(function (x) { return x.id === id })
    if (!circle) return
    const self = this
    const isCreator = !!(store.getProfile().openid && circle.creatorOpenid === store.getProfile().openid)
    const itemList = ['复制通行码']
      .concat(isCreator ? ['解散圈子（删除全部数据）', '退出圈子'] : ['退出圈子'])
    wx.showActionSheet({
      itemList: itemList,
      success(res) {
        if (itemList[res.tapIndex] === '复制通行码') {
          self.copyCircleCode({ currentTarget: { dataset: { code: circle.code || '' } } })
          return
        }
        const isDissolve = itemList[res.tapIndex] === '解散圈子（删除全部数据）'
        wx.showModal({
          title: isDissolve ? '解散圈子' : '退出圈子',
          content: isDissolve
            ? '解散后，圈子里所有人的活动和数据都会被删除，且不可恢复。确定要解散「' + circle.name + '」吗？'
            : '退出「' + circle.name + '」后，你将看不到圈内活动，其他人不受影响。确定退出吗？',
          confirmText: isDissolve ? '解散' : '退出',
          confirmColor: '#FF4D4F',
          success(modalRes) {
            if (!modalRes.confirm) return
            const cb = function (ok, error) {
              if (!ok) {
                wx.showToast({ title: error || (isDissolve ? '解散失败' : '退出失败'), icon: 'none' })
                return
              }
              wx.showToast({ title: isDissolve ? '已解散' : '已退出', icon: 'success' })
              setTimeout(function () {
                wx.reLaunch({ url: '/pages/circle/circle' })
              }, 600)
            }
            if (isDissolve) {
              store.dissolveCircle(id, cb)
            } else {
              store.leaveCircle(id, cb)
            }
          }
        })
      }
    })
  },

  goLogin() {
    wx.navigateTo({ url: '/pages/login/login' })
  },

  onShareAppMessage() {
    const circle = store.getCurrentCircle()
    return {
      title: '来「' + (circle ? circle.name : '我的圈子') + '」一起玩 🫧',
      path: '/pages/circle/circle' + (circle && circle.code ? '?code=' + circle.code : '')
    }
  },

  onShareTimeline() {
    const circle = store.getCurrentCircle()
    return {
      title: '来「' + (circle ? circle.name : '我的圈子') + '」一起玩 🫧',
      query: circle && circle.code ? 'code=' + circle.code : ''
    }
  }
})
