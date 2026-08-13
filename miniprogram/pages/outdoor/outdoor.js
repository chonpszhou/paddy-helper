const store = require('../../utils/store')
const helpers = require('../../utils/helpers')

function seasonTips() {
  const m = new Date().getMonth() + 1
  if (m >= 5 && m <= 9) {
    return ['注意防晒，戴好帽子', '随身带足饮用水', '午后容易热，备好清凉用品']
  }
  if (m === 12 || m === 1 || m === 2) {
    return ['注意保暖，穿够衣物', '带上热水和保温杯', '地面可能湿滑，注意防滑']
  }
  return ['早晚温差大，备一件外套', '穿舒适防滑的鞋子', '随身带好水和零食']
}

Page({
  data: {
    id: '',
    activity: null,
    timeText: '',
    cars: [],
    unassignedCount: 0,
    isDriver: false,
    myCarSeatsText: '',
    isRider: false,
    riderBtnText: '',
    gear: [],
    tips: [],
    weatherText: '',
    weatherLoading: false,
    weatherLoaded: false,
    weatherAdvice: ''
  },

  onLoad(options) {
    this.setData({ id: options.id })
  },

  onShow() {
    this.refresh()
    if (!this.data.weatherLoaded) {
      this.loadWeather()
    }
  },

  refresh() {
    const activity = store.getActivity(this.data.id)
    if (!activity) return
    const outdoor = activity.outdoor || { cars: [], riders: [], gear: [] }
    const profile = store.getProfile()
    const isCreator = store.isCreator(activity)

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

    const cars = outdoor.cars.map(function (c) {
      return {
        id: c.id,
        driverId: c.driverId,
        driverName: nameOf(c.driverId),
        driverEmoji: emojiOf(c.driverId),
        driverColor: colorOf(c.driverId),
        isMine: c.driverId === uid,
        seats: c.seats,
        assigned: [],
        seatsLeft: c.seats
      }
    })
    outdoor.riders.forEach(function (fid) {
      const car = cars.find(function (c) { return c.seatsLeft > 0 })
      if (car) {
        car.assigned.push({ friendId: fid, name: nameOf(fid), emoji: emojiOf(fid) })
        car.seatsLeft = car.seatsLeft - 1
      }
    })

    const assignedTotal = cars.reduce(function (n, c) { return n + c.assigned.length }, 0)
    const myCar = outdoor.cars.find(function (c) { return c.driverId === uid }) || null

    const gear = outdoor.gear.map(function (g) {
      const ownerEmojis = g.ownerIds.map(emojiOf)
      return {
        id: g.id,
        name: g.name,
        ownerCount: g.ownerIds.length,
        iOwn: g.ownerIds.indexOf(uid) >= 0,
        ownerEmojis: ownerEmojis.join(''),
        ownerText: g.ownerIds.length > 0 ? g.ownerIds.length + ' 人有' : '没人带'
      }
    })

    this.setData({
      activity: activity,
      timeText: helpers.formatDateTime(activity.startTime),
      cars: cars,
      unassignedCount: outdoor.riders.length - assignedTotal,
      isDriver: !!myCar,
      myCarSeatsText: myCar ? '我开车（可带 ' + myCar.seats + ' 人）✓' : '我开车，可带人',
      isRider: outdoor.riders.indexOf(uid) >= 0,
      riderBtnText: outdoor.riders.indexOf(uid) >= 0 ? '我需要搭车 ✓' : '我需要搭车',
      gear: gear,
      isCreator: isCreator,
      tips: seasonTips()
    })
  },

  toggleDriver() {
    const self = this
    if (this.data.isDriver) {
      const car = this.data.cars.find(function (c) { return c.isMine })
      store.removeCar(this.data.id, car.id)
      this.refresh()
      return
    }
    wx.showModal({
      title: '我开车',
      editable: true,
      placeholderText: '可带几人？比如 3',
      content: '3',
      success(res) {
        if (!res.confirm) return
        const seats = parseInt(res.content, 10)
        if (!seats || seats < 1 || seats > 8) {
          wx.showToast({ title: '填 1-8 之间的数字', icon: 'none' })
          return
        }
        store.addCar(self.data.id, seats)
        self.refresh()
        wx.showToast({ title: '已登记 🚗', icon: 'success' })
      }
    })
  },

  toggleRider() {
    const wasRider = this.data.isRider
    store.toggleRider(this.data.id)
    this.refresh()
    wx.showToast({
      title: wasRider ? '已取消搭车' : '已登记搭车',
      icon: 'none'
    })
  },

  toggleGear(e) {
    store.toggleGearOwner(this.data.id, e.currentTarget.dataset.gearId)
    this.refresh()
  },

  removeGear(e) {
    const self = this
    wx.showModal({
      title: '删除装备',
      content: '确定把这项装备从清单里删掉吗？',
      confirmText: '删除',
      confirmColor: '#FF4D4F',
      success(res) {
        if (res.confirm) {
          store.removeGear(self.data.id, e.currentTarget.dataset.gearId)
          self.refresh()
        }
      }
    })
  },

  addGear() {
    const self = this
    wx.showModal({
      title: '加装备',
      editable: true,
      placeholderText: '比如：帐篷',
      success(res) {
        if (res.confirm) {
          store.addGear(self.data.id, res.content)
          self.refresh()
        }
      }
    })
  },

  loadWeather() {
    const self = this
    this.setData({ weatherLoading: true })
    const done = function (text) {
      self.setData({
        weatherText: text && text !== 'Unknown location' ? text : '',
        weatherLoading: false,
        weatherLoaded: true,
        weatherAdvice: self.buildWeatherAdvice(text)
      })
    }
    if (wx.cloud && wx.cloud.callFunction) {
      const a = store.getActivity(this.data.id)
      wx.cloud.callFunction({
        name: 'weather',
        data: {
          lat: a && a.locationLat,
          lng: a && a.locationLng
        }
      })
        .then(function (res) {
          done((res.result && res.result.text) || '')
        })
        .catch(function () {
          self.weatherFallback(done)
        })
    } else {
      self.weatherFallback(done)
    }
  },

  buildWeatherAdvice(text) {
    const t = String(text || '')
    if (!t || t === 'Unknown location') return ''
    if (t.indexOf('雨') >= 0) return '🌧️ 有雨，记得带伞和防水装备，山路注意防滑'
    if (t.indexOf('雪') >= 0) return '❄️ 有雪，注意保暖防滑，装备选防水的'
    if (t.indexOf('雷') >= 0) return '⛈️ 有雷雨，建议调整行程或备好应急预案'
    if (t.indexOf('☀') >= 0 || t.indexOf('晴') >= 0) return '☀️ 天气不错，适合出发，记得防晒补水'
    if (t.indexOf('多云') >= 0 || t.indexOf('阴') >= 0) return '⛅ 多云天气，体感舒适，正常出发没问题'
    return '🌤️ 按预报情况准备，出发前再刷新一次天气'
  },

  weatherFallback(done) {
    if (!wx.request) {
      done('')
      return
    }
    wx.request({
      url: 'https://wttr.in/?format=%C+%t&lang=zh',
      success(res) {
        done(String(res.data || '').trim())
      },
      fail() {
        done('')
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
