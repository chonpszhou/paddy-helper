const store = require('../../../utils/store')
const helpers = require('../../../utils/helpers')
const icons = require('../../../utils/icons')
const privateMenu = require('../../../utils/private-menu')

Page({
  data: {
    types: [
      { key: 'dinner', name: '聚餐', color: '#FF8A5B', grad: 'linear-gradient(135deg, #FF9A6C, #FFC371)', iconUri: icons.typeIcon('dinner', '#FF8A5B') },
      { key: 'outdoor', name: '户外', color: '#10B981', grad: 'linear-gradient(135deg, #10B981, #5EEAD4)', iconUri: icons.typeIcon('outdoor', '#10B981') },
      { key: 'group', name: '团体活动', color: '#8B5CF6', grad: 'linear-gradient(135deg, #8B5CF6, #C4B5FD)', iconUri: icons.typeIcon('group', '#8B5CF6') },
      { key: 'trip', name: '旅行', color: '#0EA5E9', grad: 'linear-gradient(135deg, #0EA5E9, #7DD3FC)', iconUri: icons.typeIcon('trip', '#0EA5E9') }
    ],
    selectedType: 'dinner',
    dinnerMode: 'home',
    title: '',
    date: '',
    time: '19:00',
    today: '',
    location: '',
    locationAddress: '',
    locationLat: null,
    locationLng: null,
    description: '',
    circleName: '',
    isEdit: false,
    editId: '',
    submitting: false,
    stepText: '',
    smartTip: '',
    placeholders: {
      dinner: {
        title: '比如：周末家宴·火锅局',
        location: '比如：Paddy家 · 通州区',
        description: '比如：几点开饭、带什么菜、有什么忌口…'
      },
      outdoor: {
        title: '比如：凤凰岭徒步一日',
        location: '比如：凤凰岭自然风景区',
        description: '比如：全程几公里、带什么装备、几点集合…'
      },
      group: {
        title: '比如：鹅鸭杀之夜',
        location: '比如：剧本杀馆·朝阳大悦城',
        description: '比如：几个人、想玩推理还是欢乐局…'
      },
      trip: {
        title: '比如：古北水镇两日游',
        location: '比如：古北水镇·临水民宿',
        description: '比如：目的地、天数、大概预算…'
      }
    },
    titlePlaceholder: '比如：周末家宴·火锅局',
    locationPlaceholder: '比如：Paddy家 · 通州区',
    descriptionPlaceholder: '比如：几点开饭、带什么菜、有什么忌口…'
  },

  applyPlaceholders() {
    const ph = this.data.placeholders[this.data.selectedType] || this.data.placeholders.dinner
    this.setData({
      titlePlaceholder: ph.title,
      locationPlaceholder: ph.location,
      descriptionPlaceholder: ph.description
    })
    this.refreshSmartTip()
  },

  refreshSmartTip() {
    const type = this.data.selectedType
    const location = (this.data.location || '').trim()
    let tip = ''
    if (type === 'dinner') {
      if (location && store.isPaddyHome(location)) {
        tip = '🎁 选在 Paddy 家会解锁隐藏彩蛋「周鹏私房菜」，菜单自动加入点菜清单'
      } else if (this.data.dinnerMode === 'home') {
        tip = '🏠 家里开锅，记得让大家投票选菜单、登记带菜，采购清单会自动生成'
      } else {
        tip = '🍽️ 餐厅聚餐不用带菜和采购，发起后大家投个时间就行'
      }
    } else if (type === 'outdoor') {
      tip = '⛰️ 户外活动出发前记得看天气，筹备页会给出行提醒'
    } else if (type === 'group') {
      const located = (store.getFriends() || []).filter(function (f) { return f.lat && f.lng })
      if (located.length >= 2) {
        const freq = {}
        located.forEach(function (f) {
          const key = (f.location || '').replace(/[区县市]$/, '') || '附近'
          freq[key] = (freq[key] || 0) + 1
        })
        let best = '附近'
        let bestN = 0
        Object.keys(freq).forEach(function (k) {
          if (freq[k] > bestN) {
            best = k
            bestN = freq[k]
          }
        })
        tip = '📍 多数朋友在「' + best + '」附近，推荐场馆选在这个区域（筹备页会自动算居中点）'
      } else {
        tip = '🎲 发起后大家可以推荐场馆，筹备页会根据大家的位置自动算居中地点'
      }
    } else if (type === 'trip') {
      tip = '✈️ 旅行筹备支持行程安排、任务分工和 AA 记账，发起后慢慢完善'
    }
    this.setData({ smartTip: tip })
  },

  onLoad(options) {
    const editId = options && options.id
    if (editId) {
      const act = store.getActivity(editId)
      if (act) {
        this.setData({
          isEdit: true,
          editId: editId,
          today: helpers.today(),
          selectedType: act.type || 'dinner',
          dinnerMode: act.dinnerMode || 'home',
          title: act.title || '',
          date: helpers.formatDateInput(act.startTime) || helpers.today(),
          time: helpers.formatTime(act.startTime) || '19:00',
          location: act.location || '',
          locationAddress: act.locationAddress || '',
          locationLat: act.locationLat || null,
          locationLng: act.locationLng || null,
          description: act.description || ''
        })
        return
      }
    }
    const circle = store.getCurrentCircle()
    const preset = options && options.type
    const hasType = this.data.types.some(function (t) { return t.key === preset })
    this.setData({
      today: helpers.today(),
      date: helpers.today(),
      circleName: circle ? circle.name : '',
      selectedType: hasType ? preset : this.data.selectedType
    })
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 })
    }
    const pending = wx.getStorageSync('pending_create_type')
    if (pending && this.data.types.some(function (t) { return t.key === pending })) {
      this.setData({ selectedType: pending })
      wx.removeStorageSync('pending_create_type')
    }
    this.applyPlaceholders()
  },

  selectType(e) {
    this.setData({
      selectedType: e.currentTarget.dataset.key
    })
    this.applyPlaceholders()
  },

  selectDinnerMode(e) {
    this.setData({
      dinnerMode: e.currentTarget.dataset.mode
    })
    this.refreshSmartTip()
  },

  onTitle(e) {
    this.setData({ title: e.detail.value })
  },

  onDate(e) {
    this.setData({ date: e.detail.value })
  },

  onTime(e) {
    this.setData({ time: e.detail.value })
  },

  onLocation(e) {
    this.setData({ location: e.detail.value })
    this.refreshSmartTip()
  },

  pickLocation() {
    const self = this
    helpers.chooseMapLocation(function (loc) {
      self.setData({
        location: loc.name,
        locationAddress: loc.address,
        locationLat: loc.lat,
        locationLng: loc.lng
      })
      self.refreshSmartTip()
    })
  },

  onDescription(e) {
    this.setData({ description: e.detail.value })
  },

  submit() {
    const self = this
    console.log('[create] submit tapped')
    if (this.data.submitting) return
    this.setData({ submitting: true, stepText: '检查登录状态…' })
    try {
      store.requireLogin(function (ok) {
        if (!ok) {
          self.setData({ submitting: false, stepText: '' })
          return
        }
        const circle = store.getCurrentCircle()
        if (!circle) {
          self.setData({ submitting: false, stepText: '需要先加入圈子' })
          wx.showModal({
            title: '还没有圈子',
            content: '创建或加入一个圈子后，活动才能同步给朋友们',
            confirmText: '去创建/加入',
            success(res) {
              if (res.confirm) {
                wx.navigateTo({ url: '/pages/circle/circle' })
              }
              self.setData({ stepText: '' })
            }
          })
          return
        }
        self.setData({ stepText: '校验活动信息…' })
        self.proceedSubmit()
        self.setData({ submitting: false, stepText: '' })
      })
    } catch (e) {
      self.setData({ submitting: false, stepText: '' })
      console.error('[create] 提交异常', e)
      wx.showModal({
        title: '出错了',
        content: '创建失败：' + ((e && e.message) || '未知错误') + '，请重试',
        showCancel: false
      })
    }
  },

  proceedSubmit() {
    const self = this
    const title = this.data.title.trim()
    if (!title) {
      this.setData({ stepText: '' })
      wx.showToast({ title: '给活动起个名字吧', icon: 'none' })
      return
    }
    const startTime = helpers.combineDateTime(this.data.date, this.data.time)
    if (!startTime) {
      this.setData({ stepText: '' })
      wx.showModal({
        title: '请选择时间',
        content: '活动时间还没有选好，选一个日期和时间再创建吧',
        showCancel: false
      })
      return
    }
    if (startTime < Date.now()) {
      this.setData({ stepText: '' })
      wx.showModal({
        title: '时间已经过去了',
        content: '选的时间是过去的时间，换一个未来的日期或时间再创建吧',
        confirmText: '去重新选',
        success() {
          self.setData({ date: helpers.today(), time: '19:00' })
        }
      })
      return
    }
    if (!this.data.location.trim()) {
      this.setData({ stepText: '' })
      wx.showModal({
        title: '还没填地点',
        content: '不填地点的话，创建后朋友们看不到地址。确定继续吗？',
        confirmText: '继续创建',
        cancelText: '去填地点',
        success(res) {
          if (res.confirm) {
            self.saveActivity(title, startTime)
          }
        }
      })
      return
    }
    this.saveActivity(title, startTime)
  },

  saveActivity(title, startTime) {
    if (this.data.isEdit) {
      store.updateActivity(this.data.editId, {
        type: this.data.selectedType,
        dinnerMode: this.data.dinnerMode,
        title: title,
        location: this.data.location.trim(),
        locationAddress: this.data.locationAddress,
        locationLat: this.data.locationLat,
        locationLng: this.data.locationLng,
        startTime: startTime,
        description: this.data.description.trim()
      })
      wx.showToast({ title: '已保存 💾', icon: 'success' })
      setTimeout(function () {
        wx.navigateBack({
          fail() {
            wx.switchTab({ url: '/pages/index/index' })
          }
        })
      }, 600)
      return
    }
    this.doCreate(title, startTime)
  },

  doCreate(title, startTime) {
    this.setData({ stepText: '正在创建活动…' })
    const id = store.createActivity({
      type: this.data.selectedType,
      dinnerMode: this.data.dinnerMode,
      title: title,
      location: this.data.location.trim(),
      locationAddress: this.data.locationAddress,
      locationLat: this.data.locationLat,
      locationLng: this.data.locationLng,
      startTime: startTime,
      description: this.data.description.trim(),
    })
    const isEasterEgg = this.data.selectedType === 'dinner' && store.isPaddyHome(this.data.location)
    const goDetail = function () {
      wx.navigateTo({
        url: '/pages/activity/detail/detail?id=' + id
      })
    }
    if (isEasterEgg) {
      wx.showModal({
        title: '🎁 彩蛋解锁！',
        content: '在周鹏家吃饭，隐藏菜单「周鹏私房菜」已开放——鄂尔多斯、巴彦淖尔、东北风味 50 道，等着大家开席～',
        confirmText: '去看看',
        showCancel: false,
        success() {
          goDetail()
        }
      })
    } else {
      wx.showToast({ title: '活动创建成功 🎉', icon: 'success' })
      setTimeout(function () {
        goDetail()
      }, 600)
    }
    this.clearForm()
  },

  clearForm() {
    this.setData({
      title: '',
      location: '',
      locationAddress: '',
      locationLat: null,
      locationLng: null,
      description: '',
      date: helpers.today(),
      selectedType: this.data.selectedType,
      dinnerMode: 'home',
      time: '19:00',
      stepText: ''
    })
  }
})
