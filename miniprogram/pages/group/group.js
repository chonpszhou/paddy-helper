const store = require('../../utils/store')
const helpers = require('../../utils/helpers')

Page({
  data: {
    id: '',
    activity: null,
    timeText: '',
    center: null,
    centerText: '',
    locatedCount: 0,
    missingNames: [],
    missingNamesText: '',
    venues: [],
    markers: [],
    mapLat: null,
    mapLng: null,
    hasFinal: false,
    finalName: '',
    groupGame: '',
    wolf: { phase: 'ready', players: [] },
    wolfPlayers: [],
    wolfPlayerCount: 0,
    wolfAliveCount: 0,
    wolfDeckText: '',
    isGod: false
  },

  onLoad(options) {
    this.setData({ id: options.id })
    this._revealed = {}
  },

  onShow() {
    this.refresh()
  },

  aiGroup() {
    const self = this
    wx.showModal({
      title: '✨ AI 推荐玩法',
      editable: true,
      placeholderText: '比如：6 人，想玩推理类的',
      success(res) {
        if (!res.confirm) return
        const topic = (res.content || '').trim()
        if (!topic) {
          wx.showToast({ title: '说说人数和偏好吧', icon: 'none' })
          return
        }
        wx.showLoading({ title: 'AI 推荐中…', mask: true })
        store.aiCall('group', { topic: topic }, function (ok, data, error) {
          wx.hideLoading()
          if (!ok) {
            wx.showToast({ title: error || 'AI 生成失败', icon: 'none' })
            return
          }
          const s = data.suggestions || []
          let content = s.map(function (x, i) {
            return (i + 1) + '. ' + x.name + '（' + (x.category || '') + '）\n' +
              '   ⏱ ' + (x.duration || '待定') + ' · 💰 ' + (x.budget || '待定') + '\n' +
              '   💡 ' + (x.reason || '')
          }).join('\n\n')
          if ((data.tips || []).length) {
            content += '\n\n组织建议：\n' + data.tips.map(function (t) { return '· ' + t }).join('\n')
          }
          wx.showModal({
            title: '✨ 推荐方案',
            content: content || 'AI 没有生成推荐，换个说法试试',
            showCancel: false,
            confirmText: '好的'
          })
        })
      }
    })
  },

  refresh() {
    const activity = store.getActivity(this.data.id)
    if (!activity) return
    const group = activity.group || { venues: [], finalVenueId: null }
    const profile = store.getProfile()
    const groupGame = activity.groupGame || (group.game) || ''

    const emojiOf = function (fid) {
      if (fid === store.currentUid()) return '👨‍🍳'
      const f = store.getFriend(fid) || store.getCachedUser(fid)
      return f ? f.emoji : '🙂'
    }
    const uid = store.currentUid()
    const isCreator = store.isCreator(activity)

    const participants = (activity.signups || []).filter(function (s) { return s.status === 'yes' })
      .map(function (s) {
        if (s.friendId === uid) {
          return { id: uid, name: profile.name || '朋友', lat: profile.lat, lng: profile.lng }
        }
        const f = store.getFriend(s.friendId) || store.getCachedUser(s.friendId)
        return f ? { id: f.id, name: f.name, lat: f.lat, lng: f.lng } : null
      })
      .filter(function (p) { return p !== null })

    const located = participants.filter(function (p) { return p.lat })
    const missing = participants.filter(function (p) { return !p.lat })
    let center = null
    if (located.length > 0) {
      const latSum = located.reduce(function (n, p) { return n + Number(p.lat) }, 0)
      const lngSum = located.reduce(function (n, p) { return n + Number(p.lng) }, 0)
      center = { lat: latSum / located.length, lng: lngSum / located.length }
    }

    const venues = group.venues.map(function (v) {
      const dist = center && v.lat ? helpers.distanceKm(center.lat, center.lng, v.lat, v.lng) : null
      return {
        id: v.id,
        name: v.name,
        address: v.address || '',
        voteCount: v.votes.length,
        voted: v.votes.indexOf(uid) >= 0,
        isFinal: group.finalVenueId === v.id,
        isMine: v.creatorId === uid,
        isCreator: isCreator,
        distanceText: helpers.distanceText(dist),
        distanceKm: dist,
        votersText: v.votes.slice(0, 6).map(emojiOf).join('')
      }
    }).sort(function (a, b) {
      const da = a.distanceKm === null ? 1e9 : a.distanceKm
      const db = b.distanceKm === null ? 1e9 : b.distanceKm
      return da - db
    })

    const markers = []
    if (center) {
      markers.push({
        id: 1000,
        latitude: Number(center.lat.toFixed(6)),
        longitude: Number(center.lng.toFixed(6)),
        iconPath: '/assets/map/star.png',
        width: 44,
        height: 44,
        label: { content: '居中点', color: '#E8483F', fontSize: 11 }
      })
      located.forEach(function (p, i) {
        markers.push({
          id: i,
          latitude: Number(p.lat),
          longitude: Number(p.lng),
          iconPath: '/assets/map/dot.png',
          width: 30,
          height: 30,
          label: { content: p.name, color: '#3B3A38', fontSize: 11 }
        })
      })
      venues.forEach(function (v, i) {
        if (!v.lat) return
        markers.push({
          id: 2000 + i,
          latitude: Number(v.lat),
          longitude: Number(v.lng),
          iconPath: '/assets/map/venue.png',
          width: 30,
          height: 30,
          label: { content: v.name, color: '#8B6CF6', fontSize: 11 }
        })
      })
    }

    const finalVenue = group.venues.find(function (v) { return v.id === group.finalVenueId }) || null

    // 🐺 狼人杀：游戏状态映射
    const w = (activity.group && activity.group.werewolf) || { phase: 'ready', players: [] }
    const revealedMap = this._revealed || {}
    const wolfPlayers = (w.players || []).map(function (p) {
      let name = '朋友'
      if (p.uid === uid) {
        name = profile.name || '朋友'
      } else {
        const f = store.getFriend(p.uid) || store.getCachedUser(p.uid)
        if (f) name = f.name
      }
      const meta = store.WEREWOLF_ROLE_META[p.role] || { icon: '🎭', color: '#6B7280' }
      return {
        uid: p.uid,
        name: name,
        isMe: p.uid === uid,
        role: p.role,
        roleIcon: meta.icon,
        roleColor: meta.color,
        dead: p.alive === false,
        revealed: !!revealedMap[p.uid]
      }
    })
    const wolfPlayerCount = (activity.signups || []).filter(function (s) { return s.status === 'yes' }).length
    const wolfAliveCount = (w.players || []).filter(function (p) { return p.alive !== false }).length
    const godUid = w.godUid || ''
    const noGod = !godUid
    const isGod = !!godUid && godUid === uid
    let godName = ''
    if (godUid) {
      if (godUid === uid) {
        godName = profile.name || '我'
      } else {
        const f = store.getFriend(godUid) || store.getCachedUser(godUid)
        godName = f ? f.name : '朋友'
      }
    }
    const wolfDeckCounts = {}
    store.werewolfAutoDeck(wolfPlayerCount).forEach(function (r) {
      wolfDeckCounts[r] = (wolfDeckCounts[r] || 0) + 1
    })
    const wolfDeckText = Object.keys(wolfDeckCounts).map(function (r) {
      return r + (wolfDeckCounts[r] > 1 ? '×' + wolfDeckCounts[r] : '')
    }).join(' · ')

    this.setData({
      activity: activity,
      timeText: helpers.formatDateTime(activity.startTime),
      center: center,
      centerText: center ? center.lat.toFixed(4) + ', ' + center.lng.toFixed(4) : '',
      locatedCount: located.length,
      missingNames: missing.map(function (p) { return p.name }),
      missingNamesText: missing.map(function (p) { return p.name }).join('、'),
      venues: venues,
      markers: markers,
      mapLat: center ? center.lat : null,
      mapLng: center ? center.lng : null,
      hasFinal: !!finalVenue,
      finalName: finalVenue ? finalVenue.name : '',
      isCreator: isCreator,
      groupGame: groupGame,
      wolf: w,
      wolfPlayers: wolfPlayers,
      wolfPlayerCount: wolfPlayerCount,
      wolfAliveCount: wolfAliveCount,
      wolfDeckText: wolfDeckText,
      isGod: isGod,
      noGod: noGod,
      godName: godName
    })
  },

  claimGod() {
    if (store.claimWerewolfGod(this.data.id)) {
      this.refresh()
      wx.showToast({ title: '你已成为上帝 👑', icon: 'success' })
    } else {
      wx.showToast({ title: '上帝已经有人了哦', icon: 'none' })
    }
  },

  resignGod() {
    const self = this
    wx.showModal({
      title: '让出上帝',
      content: '确定把上帝身份让出来吗？其他人可以重新认领。',
      confirmText: '让出',
      confirmColor: '#B45309',
      success(res) {
        if (res.confirm) {
          store.resignWerewolfGod(self.data.id)
          self.refresh()
        }
      }
    })
  },

  startWolf() {
    if (!this.data.isGod) {
      wx.showToast({ title: '只有上帝可以配牌', icon: 'none' })
      return
    }
    const ok = store.assignWerewolf(this.data.id)
    if (!ok) {
      wx.showToast({ title: '先让大家确认参加吧', icon: 'none' })
      return
    }
    this._revealed = {}
    this.refresh()
    wx.showToast({ title: '角色已分配 🐺', icon: 'success' })
  },

  flipWolfCard(e) {
    const uid = e.currentTarget.dataset.uid
    if (!this.data.isGod && uid !== store.currentUid()) {
      wx.showToast({ title: '只能翻自己的牌哦 🔒', icon: 'none' })
      return
    }
    if (!this._revealed) this._revealed = {}
    this._revealed[uid] = !this._revealed[uid]
    this.refresh()
  },

  toggleWolfAlive(e) {
    if (!this.data.isGod) {
      wx.showToast({ title: '只有上帝可以标记出局', icon: 'none' })
      return
    }
    store.toggleWerewolfAlive(this.data.id, e.currentTarget.dataset.uid)
    this.refresh()
  },

  toggleWolfPhase() {
    if (!this.data.isGod) {
      wx.showToast({ title: '只有上帝可以切换天黑天亮', icon: 'none' })
      return
    }
    const next = this.data.wolf.phase === 'night' ? 'day' : 'night'
    store.setWerewolfPhase(this.data.id, next)
    this.refresh()
  },

  resetWolf() {
    const self = this
    if (!this.data.isGod) {
      wx.showToast({ title: '只有上帝可以重新配牌', icon: 'none' })
      return
    }
    wx.showModal({
      title: '重新分配',
      content: '确定清空当前角色重新分配吗？出局记录也会一起清掉。',
      confirmText: '重新分配',
      confirmColor: '#FF4D4F',
      success(res) {
        if (res.confirm) {
          store.resetWerewolf(self.data.id)
          self._revealed = {}
          self.refresh()
        }
      }
    })
  },

  toggleVote(e) {
    store.toggleVenueVote(this.data.id, e.currentTarget.dataset.venueId)
    this.refresh()
  },

  setFinal(e) {
    store.setFinalVenue(this.data.id, e.currentTarget.dataset.venueId)
    this.refresh()
  },

  removeVenue(e) {
    const self = this
    const venueId = e.currentTarget.dataset.venueId
    wx.showModal({
      title: '删除场馆',
      content: '确定删除这个候选场馆吗？',
      confirmColor: '#FF4D4F',
      success(res) {
        if (res.confirm) {
          store.removeVenue(self.data.id, venueId)
          self.refresh()
        }
      }
    })
  },

  addVenue() {
    const self = this
    helpers.chooseMapLocation(function (loc) {
      if (!loc.name) {
        wx.showToast({ title: '请选择有名称的地点', icon: 'none' })
        return
      }
      wx.showModal({
        title: '确认场馆',
        editable: true,
        content: loc.name,
        placeholderText: '场馆名字',
        success(res) {
          if (!res.confirm) return
          store.addVenue(self.data.id, {
            name: res.content || loc.name,
            address: loc.address,
            lat: loc.lat,
            lng: loc.lng
          })
          self.refresh()
        }
      })
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
