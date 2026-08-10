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
    finalName: ''
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
    const group = activity.group || { venues: [], finalVenueId: null }
    const profile = store.getProfile()

    const emojiOf = function (fid) {
      if (fid === store.currentUid()) return '👨‍🍳'
      const f = store.getFriend(fid) || store.getCachedUser(fid)
      return f ? f.emoji : '🙂'
    }
    const uid = store.currentUid()

    const participants = (activity.signups || []).filter(function (s) { return s.status === 'yes' })
      .map(function (s) {
        if (s.friendId === uid) {
          return { id: uid, name: profile.name, lat: profile.lat, lng: profile.lng }
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
      finalName: finalVenue ? finalVenue.name : ''
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
