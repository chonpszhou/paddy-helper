const store = require('../../../utils/store')
const helpers = require('../../../utils/helpers')
const icons = require('../../../utils/icons')

const SPECIAL = {
  dinner: {
    title: '🍲 聚餐筹备',
    actionText: '进入筹备 ›',
    goUrl: '/pages/dinner/dinner'
  },
  outdoor: {
    title: '🎒 户外筹备',
    actionText: '进入筹备 ›',
    goUrl: '/pages/outdoor/outdoor'
  },
  group: {
    title: '🎲 团体活动筹备',
    actionText: '进入筹备 ›',
    goUrl: '/pages/group/group'
  },
  trip: {
    title: '🗺️ 旅行筹备',
    actionText: '进入筹备 ›',
    goUrl: '/pages/trip/trip'
  }
}

Page({
  data: {
    id: '',
    cid: '',
    activity: null,
    preview: null,
    meta: {},
    creatorName: '',
    confirmed: 0,
    maybe: 0,
    members: 0,
    checkedInCount: 0,
    iCheckedIn: false,
    ended: false,
    signupOptions: [
      { key: 'yes', icon: '✅', label: '参加' },
      { key: 'maybe', icon: '🤔', label: '待定' },
      { key: 'no', icon: '❌', label: '不参加' }
    ],
    myStatus: '',
    myNote: '',
    membersList: [],
    photos: [],
    photoUrls: [],
    special: null,
    isCreator: false,
    typeIconW: '',
    errorMsg: '',
    countdown: { kind: '', text: '', hm: '', days: 0 },
    icons: {
      clockW: icons.icon('clock', '#FFFFFF'),
      pinW: icons.icon('pin', '#FFFFFF'),
      edit: icons.icon('edit', '#EAF0F8'),
      camera: icons.icon('camera', '#EAF0F8'),
      share: icons.icon('share', '#EAF0F8')
    }
  },

  onLoad(options) {
    this.setData({ id: options.id || '', cid: options.cid || '' })
  },

  onShow() {
    this.refresh()
    const self = this
    if (this._countdownTimer) {
      clearInterval(this._countdownTimer)
    }
    this._countdownTimer = setInterval(function () {
      self.updateCountdown()
    }, 30000)
  },

  onHide() {
    if (this._countdownTimer) {
      clearInterval(this._countdownTimer)
      this._countdownTimer = null
    }
  },

  onUnload() {
    this._destroyed = true
    if (this._countdownTimer) {
      clearInterval(this._countdownTimer)
      this._countdownTimer = null
    }
  },

  refresh() {
    let activity = this.data.id ? store.getActivity(this.data.id) : null
    if (!activity && this.data.cid) {
      activity = store.getActivityByCloudId(this.data.cid)
      if (activity) {
        this.setData({ id: activity.id })
      }
    }
    if (!activity) {
      // 从订阅通知点进来时，云端活动可能还没拉到本地：先拉一次再试
      if (this.data.cid && !this._triedPull) {
        this._triedPull = true
        const self = this
        store.pullActivities(function () {
          if (self._destroyed) return
          const act = self.data.id ? store.getActivity(self.data.id) : store.getActivityByCloudId(self.data.cid)
          if (act) {
            self.refresh()
          } else {
            self.loadPreview()
          }
        })
        return
      }
      if (this.data.cid) {
        this.loadPreview()
        return
      }
      this.setData({
        activity: null,
        errorMsg: '活动不存在或已被删除。如果刚收到通知，活动可能在其他圈子，去「我的 → 我的圈子」切换后再看。'
      })
      return
    }
    try {
      this.setData({ preview: null })
      const meta = store.TYPE_META[activity.type] || { name: '活动', icon: '📌', color: '#6B7280', grad: 'linear-gradient(135deg, #9AA3AF, #D3D8DF)' }
      const my = store.mySignup(activity)
      const profile = store.getProfile()
      const uid = store.currentUid()
      const isCreator = activity.creatorId === uid || (!!activity.creatorOpenid && activity.creatorOpenid === profile.openid)
      const membersList = (activity.signups || []).map(function (s) {
        let friend = null
        if (s.friendId === store.currentUid()) {
          friend = { id: s.friendId, name: profile.name || '朋友', location: profile.location, color: '#00E5A0', emoji: '👨‍🍳' }
        } else {
          friend = store.getFriend(s.friendId) || store.getCachedUser(s.friendId)
        }
        if (!friend) return null
        const statusMeta = store.SIGNUP_META[s.status]
        const statusColor = s.status === 'yes' ? '#00E5A0' : s.status === 'maybe' ? '#F5B83D' : s.status === 'no' ? '#8B95A7' : '#7C8698'
        return {
          id: friend.id,
          name: friend.name,
          emoji: friend.emoji,
          color: friend.color,
          isMe: s.friendId === store.currentUid(),
          note: s.note || '',
          statusText: statusMeta ? statusMeta.icon + ' ' + statusMeta.label : '📨 已邀请',
          statusColor: statusColor,
          checkedIn: !!s.checkedIn,
          sortIndex: ['yes', 'maybe', 'no', 'invited'].indexOf(s.status)
        }
      }).filter(function (x) { return x !== null })
        .sort(function (a, b) { return a.sortIndex - b.sortIndex })

      const checkedInCount = (activity.signups || []).filter(function (s) {
        return s.status === 'yes' && s.checkedIn
      }).length

      const photos = (activity.photos || []).map(function (p) {
        const likes = p.likes || []
        const dislikes = p.dislikes || []
        const score = likes.length - dislikes.length
        return {
          id: p.id,
          src: p.src,
          likeCount: likes.length,
          dislikeCount: dislikes.length,
          liked: likes.indexOf(uid) >= 0,
          disliked: dislikes.indexOf(uid) >= 0,
          score: score,
          scoreText: score > 0 ? '+' + score : '' + score
        }
      }).sort(function (a, b) {
        if (b.score !== a.score) return b.score - a.score
        return a.id < b.id ? -1 : 1
      })
      photos.forEach(function (p, i) {
        p.rank = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : ''
      })
      const photoUrls = photos.map(function (p) { return p.src })

      let special = SPECIAL[activity.type] || null
      if (special && special.goUrl && activity.type === 'dinner') {
        const dinner = activity.dinner || {}
        const slotCount = (dinner.timeSlots || []).length
        const dishCount = (dinner.dishes || []).length
        const itemCount = (dinner.bringItems || []).length
        if (activity.dinnerMode === 'restaurant') {
          special = Object.assign({}, special, {
            text: '🍽️ 餐厅聚餐 · 时间投票 ' + slotCount + ' 个'
          })
        } else {
          special = Object.assign({}, special, {
            text: '时间投票 ' + slotCount + ' 个 · 点菜 ' + dishCount + ' 道 · 带菜 ' + itemCount + ' 件' +
              (store.isPaddyHome(activity.location) ? ' · 🎁 私房菜已解锁' : '')
          })
        }
      }
      if (special && special.goUrl && activity.type === 'outdoor') {
        const outdoor = activity.outdoor || {}
        const carCount = (outdoor.cars || []).length
        const riderCount = (outdoor.riders || []).length
        const gearCount = (outdoor.gear || []).length
        special = Object.assign({}, special, {
          text: '拼车 ' + carCount + ' 辆 · 搭车 ' + riderCount + ' 人 · 装备 ' + gearCount + ' 件'
        })
      }
      if (special && special.goUrl && activity.type === 'group') {
        const group = activity.group || {}
        const finalVenue = (group.venues || []).find(function (v) { return v.id === group.finalVenueId }) || null
        const gameTag = activity.groupGame === 'werewolf' ? '🐺 狼人杀局 · ' : ''
        special = Object.assign({}, special, {
          text: gameTag + (finalVenue ? '已选定：' + finalVenue.name : '候选场馆 ' + (group.venues || []).length + ' 家 · 待定')
        })
      }
      if (special && special.goUrl && activity.type === 'trip') {
        const trip = activity.trip || {}
        const dayCount = (trip.days || []).length
        const taskCount = (trip.tasks || []).length
        const total = (trip.expenses || []).reduce(function (n, e) { return n + (Number(e.amount) || 0) }, 0)
        special = Object.assign({}, special, {
          text: '行程 ' + dayCount + ' 天 · 分工 ' + taskCount + ' 项 · 预算 ¥' + total
        })
      }

      this.setData({
        activity: activity,
        typeIconW: icons.typeIcon(activity.type, '#FFFFFF'),
        meta: meta,
        creatorName: activity.creatorName || profile.name || '朋友',
        timeText: helpers.formatDateTime(activity.startTime),
        confirmed: store.countConfirmed(activity),
        maybe: store.countMaybe(activity),
        members: (activity.signups || []).length,
        myStatus: my ? my.status : '',
        myNote: my ? my.note : '',
        membersList: membersList,
        ended: activity.status === 'ended',
        checkedInCount: checkedInCount,
        iCheckedIn: !!(my && my.status === 'yes' && my.checkedIn),
        photos: photos,
        photoUrls: photoUrls,
        special: special,
        isCreator: isCreator,
        errorMsg: ''
      })
      this.updateCountdown()
    } catch (e) {
      console.error('[detail] 页面加载失败', e)
      this.setData({
        activity: null,
        errorMsg: '页面加载出错，试试重新打开'
      })
    }
  },

  loadPreview() {
    const self = this
    store.previewActivity(this.data.cid, function (ok, preview) {
      if (self._destroyed) return
      if (ok && preview) {
        const theme = store.TYPE_META[preview.type] || { name: '活动', icon: '📌', color: '#6B7280', grad: 'linear-gradient(135deg, #9AA3AF, #D3D8DF)' }
        self.setData({
          preview: Object.assign({}, preview, {
            typeName: theme.name,
            color: theme.color,
            grad: theme.grad,
            timeText: helpers.formatDateTime(preview.startTime)
          }),
          activity: null,
          errorMsg: ''
        })
      } else {
        self.setData({
          activity: null,
          preview: null,
          errorMsg: '活动不存在或已被删除。如果刚收到通知，活动可能在其他圈子，去「我的 → 我的圈子」切换后再看。'
        })
      }
    })
  },

  goJoin() {
    const self = this
    // 记录返回路径：登录/加入圈子成功后自动回到这个活动
    const ret = '/pages/activity/detail/detail?cid=' + this.data.cid
    try {
      wx.setStorageSync('circle_return', ret)
      wx.setStorageSync('login_return', '/pages/circle/circle')
    } catch (e) {
      // 存储失败不影响主流程
    }
    store.requireLogin(function (ok) {
      if (!ok) return
      wx.navigateTo({
        url: '/pages/circle/circle'
      })
    })
  },

  updateCountdown() {
    const a = this.data.activity
    if (!a) return
    let parts = helpers.countdownParts(a.startTime)
    if (a.status === 'ended') {
      parts = { kind: 'ended' }
    }
    const kind = parts ? parts.kind : ''
    this.setData({
      countdown: {
        kind: kind,
        text: helpers.countdownDetail(a.startTime),
        hm: helpers.formatTime(a.startTime),
        days: parts ? parts.days : 0
      }
    })
  },

  chooseStatus(e) {
    const self = this
    const status = e.currentTarget.dataset.status
    store.requireLogin(function (ok) {
      if (!ok) return
      store.signup(self.data.id, status, status === 'yes' ? self.data.myNote : '')
      self.refresh()
      const label = { yes: '已报名参加 ✅', maybe: '已标记待定 🤔', no: '已标记不参加' }[status]
      wx.showToast({ title: label, icon: 'none' })
    })
  },

  onNote(e) {
    this.setData({ myNote: e.detail.value })
  },

  toggleCheckIn() {
    const self = this
    store.requireLogin(function (ok) {
      if (!ok) return
      if (store.toggleCheckIn(self.data.id)) {
        self.refresh()
        wx.showToast({ title: self.data.iCheckedIn ? '已签到 📍' : '已取消签到', icon: 'none' })
      } else {
        wx.showToast({ title: '报名「参加」后才能签到哦', icon: 'none' })
      }
    })
  },

  copyInvite() {
    const a = this.data.activity
    if (!a) return
    const path = a.cloudId ? 'cid=' + a.cloudId : 'id=' + a.id
    const text = '【Paddy小助手】周末约起来 🫧\n' +
      '🏷️ ' + a.title + '\n' +
      '🕐 ' + helpers.formatDateTime(a.startTime) + '\n' +
      '📍 ' + (a.location || '地点待定') + '\n' +
      '— 打开小程序点开链接查看详情，加入圈子后就能报名啦：'
    wx.setClipboardData({
      data: text,
      success() {
        wx.showToast({ title: '邀请文案已复制，记得提醒朋友加入圈子 ✨', icon: 'none' })
      }
    })
  },

  goSpecial() {
    const sp = this.data.special
    if (sp && sp.goUrl) {
      wx.navigateTo({
        url: sp.goUrl + '?id=' + this.data.id
      })
    }
  },

  goEdit() {
    // 发起页是 tabBar 页面，navigateTo 无法跳转，改用 reLaunch 带参进入编辑态
    wx.reLaunch({
      url: '/pages/activity/create/create?id=' + this.data.id
    })
  },

  goPoster() {
    wx.navigateTo({
      url: '/pages/poster/poster?id=' + this.data.id
    })
  },

  uploadPhotos() {
    const self = this
    store.requireLogin(function (ok) {
      if (!ok) return
      wx.chooseMedia({
        count: 9,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        success(res) {
          const files = res.tempFiles || []
          if (!files.length) return
          wx.showLoading({ title: '上传中…', mask: true })
          let done = 0
          files.forEach(function (f) {
            helpers.persistPhoto(f.tempFilePath, self.data.id, function (src) {
              store.addPhoto(self.data.id, src)
              done++
              if (done >= files.length) {
                wx.hideLoading()
                self.refresh()
                wx.showToast({ title: '已上传 ' + files.length + ' 张', icon: 'success' })
              }
            })
          })
        }
      })
    })
  },

  togglePhotoVote(e) {
    store.togglePhotoVote(this.data.id, e.currentTarget.dataset.id, e.currentTarget.dataset.type)
    this.refresh()
  },

  previewPhoto(e) {
    const urls = this.data.photoUrls
    wx.previewImage({
      urls: urls,
      current: urls[e.currentTarget.dataset.index] || urls[0]
    })
  },

  openLocation() {
    const a = this.data.activity
    helpers.openMap(a.title, a.location, a.locationLat, a.locationLng)
  },

  goBack() {
    wx.navigateBack({
      fail() {
        wx.switchTab({
          url: '/pages/index/index'
        })
      }
    })
  },

  sharePath() {
    const activity = this.data.activity
    if (activity) {
      return activity.cloudId ? 'cid=' + activity.cloudId : 'id=' + activity.id
    }
    if (this.data.cid) return 'cid=' + this.data.cid
    return 'id=' + this.data.id
  },

  onShareAppMessage() {
    const title = this.data.activity ? this.data.activity.title : '周末一起约'
    return {
      title: title + '，来吗？',
      path: '/pages/activity/detail/detail?' + this.sharePath()
    }
  },

  onShareTimeline() {
    const title = this.data.activity ? this.data.activity.title : '周末一起约'
    return {
      title: title + '，来吗？',
      query: this.sharePath()
    }
  }
})
