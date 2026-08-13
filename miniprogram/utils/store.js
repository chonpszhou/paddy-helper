const STORAGE_KEY = 'paddy_helper_data_v1'
const ONBOARD_KEY = 'paddy_onboard_done'
const privateMenu = require('./private-menu')

const TYPE_META = {
  dinner: { name: '聚餐', icon: '🍲', color: '#FF8A5B', grad: 'linear-gradient(135deg, #FF9A6C, #FFC371)' },
  outdoor: { name: '户外', icon: '⛺', color: '#10B981', grad: 'linear-gradient(135deg, #10B981, #5EEAD4)' },
  group: { name: '团体活动', icon: '🎲', color: '#8B5CF6', grad: 'linear-gradient(135deg, #8B5CF6, #C4B5FD)' },
  trip: { name: '旅行', icon: '✈️', color: '#0EA5E9', grad: 'linear-gradient(135deg, #0EA5E9, #7DD3FC)' }
}

const SIGNUP_META = {
  yes: { label: '参加', icon: '✅' },
  maybe: { label: '待定', icon: '🤔' },
  no: { label: '不参加', icon: '❌' }
}

function demoDinnerData() {
  return {
    timeSlots: [
      { id: 'ts1', label: '周六 17:30', votes: ['me', 'f1', 'f2', 'f3'] },
      { id: 'ts2', label: '周六 18:30', votes: ['me', 'f1', 'f4', 'f5', 'f7', 'f8'] },
      { id: 'ts3', label: '周六 19:30', votes: ['me', 'f5', 'f8'] },
      { id: 'ts4', label: '周日 12:00', votes: ['f2', 'f6'] }
    ],
    dishes: [
      { id: 'd1', name: '牛油辣锅底', voters: ['me', 'f2', 'f4', 'f5'] },
      { id: 'd2', name: '番茄锅底', voters: ['me', 'f1', 'f7', 'f8'] },
      { id: 'd3', name: '肥牛卷', voters: ['me', 'f1', 'f2', 'f4', 'f7', 'f8'] },
      { id: 'd4', name: '鲜切牛肉', voters: ['f1', 'f2', 'f4', 'me'] },
      { id: 'd5', name: '虾滑', voters: ['me', 'f5', 'f7'] },
      { id: 'd6', name: '毛肚', voters: ['me', 'f2', 'f4'] },
      { id: 'd7', name: '手打牛肉丸', voters: ['f4', 'f8', 'me'] },
      { id: 'd8', name: '宽粉', voters: ['f5', 'f8', 'f1'] },
      { id: 'd9', name: '娃娃菜', voters: ['f1', 'f7', 'me'] },
      { id: 'd10', name: '金针菇', voters: ['f7', 'f8', 'f5'] },
      { id: 'd11', name: '午餐肉', voters: ['f4', 'f2'] },
      { id: 'd12', name: '鸭血', voters: ['f4', 'me'] }
    ],
    bringItems: [
      { id: 'bi1', friendId: 'f1', item: '鲜切牛肉' },
      { id: 'bi2', friendId: 'f3', item: '黄油啤酒' },
      { id: 'bi3', friendId: 'f4', item: '蛋糕' },
      { id: 'bi4', friendId: 'f5', item: '大沙拉' },
      { id: 'bi5', friendId: 'f7', item: '果酒' },
      { id: 'bi6', friendId: 'f8', item: '菌菇拼盘' }
    ]
  }
}

function demoOutdoorData() {
  return {
    cars: [
      { id: 'car1', driverId: 'me', seats: 3, note: '' },
      { id: 'car2', driverId: 'f4', seats: 2, note: '' }
    ],
    riders: ['f1', 'f2', 'f7'],
    gear: [
      { id: 'g1', name: '登山杖', ownerIds: ['f3'] },
      { id: 'g2', name: '防晒霜', ownerIds: ['f1'] },
      { id: 'g3', name: '急救包', ownerIds: ['me'] },
      { id: 'g4', name: '保温杯', ownerIds: ['f2'] },
      { id: 'g5', name: '驱蚊液', ownerIds: ['f7'] },
      { id: 'g6', name: '折叠坐垫', ownerIds: ['f4'] }
    ]
  }
}

function demoGroupData() {
  return {
    finalVenueId: null,
    venues: [
      { id: 'v1', name: '桌游CLUB·朝阳大悦城', address: '朝阳区朝阳大悦城附近', lat: 39.924, lng: 116.517, votes: ['me', 'f7', 'f4'], creatorId: 'me' },
      { id: 'v2', name: '剧本杀馆·中关村', address: '海淀区中关村', lat: 39.983, lng: 116.315, votes: ['f8'], creatorId: 'f8' },
      { id: 'v3', name: '狼人杀CLUB·西单', address: '西城区西单', lat: 39.910, lng: 116.374, votes: ['f5'], creatorId: 'f5' },
      { id: 'v4', name: '鹅鸭杀主题馆·通州万达', address: '通州区万达广场', lat: 39.906, lng: 116.656, votes: [], creatorId: 'f4' }
    ]
  }
}

function demoTripData() {
  return {
    days: [
      {
        id: 'day1',
        title: 'Day 1 · 周六',
        items: [
          { id: 'i1', time: '09:00', content: '国贸集合出发' },
          { id: 'i2', time: '11:30', content: '抵达古北水镇民宿，办入住' },
          { id: 'i3', time: '12:00', content: '农家乐午餐' },
          { id: 'i4', time: '14:00', content: '司马台长城徒步' },
          { id: 'i5', time: '18:30', content: '民宿晚餐 + 桌游' }
        ]
      },
      {
        id: 'day2',
        title: 'Day 2 · 周日',
        items: [
          { id: 'i6', time: '08:30', content: '早餐' },
          { id: 'i7', time: '09:30', content: '司马台长城看日出' },
          { id: 'i8', time: '11:00', content: '退房，返程' }
        ]
      }
    ],
    tasks: [
      { id: 't1', name: '订民宿', ownerId: 'f1' },
      { id: 't2', name: '门票与保险', ownerId: 'me' },
      { id: 't3', name: '开车', ownerId: 'f4' },
      { id: 't4', name: '零食饮料', ownerId: 'f5' },
      { id: 't5', name: '拍照攻略', ownerId: 'f7' },
      { id: 't6', name: '准备桌游', ownerId: null }
    ],
    stays: [
      { id: 's1', name: '古北水镇·临水民宿', cost: 680, nights: 2, ownerId: 'f1' }
    ],
    expenses: [
      { id: 'e1', item: '民宿（2晚）', amount: 1360, payerId: 'f1' },
      { id: 'e2', item: '门票', amount: 90, payerId: 'me' },
      { id: 'e3', item: '油费', amount: 150, payerId: 'f4' },
      { id: 'e4', item: '零食饮料', amount: 86, payerId: 'f5' }
    ]
  }
}

function demoPhotosData() {
  return [
    { id: 'p1', src: '/assets/photos/sunset.png', likes: ['me', 'f1', 'f2', 'f3', 'f5'], dislikes: [], createdAt: 1 },
    { id: 'p2', src: '/assets/photos/hotpot.png', likes: ['f1', 'f4', 'f7', 'f8'], dislikes: ['f2'], createdAt: 2 },
    { id: 'p3', src: '/assets/photos/mountain.png', likes: ['me', 'f4', 'f5', 'f6'], dislikes: [], createdAt: 3 },
    { id: 'p4', src: '/assets/photos/tent.png', likes: ['f3', 'f7'], dislikes: ['f5', 'f8'], createdAt: 4 }
  ]
}

var FRIEND_COORDS = {
  f1: [39.909, 116.656],
  f2: [39.921, 116.443],
  f3: [39.959, 116.298],
  f4: [39.928, 116.416],
  f5: [39.915, 116.366],
  f6: [39.858, 116.287],
  f7: [40.220, 116.231],
  f8: [40.130, 116.654]
}

var ACTIVITY_COORDS = {
  a_seed_dinner: [39.909, 116.656],
  a_seed_outdoor: [40.107, 116.118],
  a_seed_trip: [40.631, 117.143]
}

function nextWeekday(dayOfWeek) {
  const now = new Date()
  const diff = (dayOfWeek - now.getDay() + 7) % 7 || 7
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff)
  return d.getTime()
}

function seedData() {
  const hour = 3600000
  const day = 24 * hour
  const sat = nextWeekday(6) + 18 * hour + 30 * 60 * 1000
  const sat9 = nextWeekday(6) + 9 * hour
  const sun = nextWeekday(0) + 7 * hour + 30 * 60 * 1000
  const fri = nextWeekday(5) + 19 * hour + 30 * 60 * 1000
  return {
    usersCache: {},
    profile: {
      name: 'Paddy',
      partner: '白敏',
      location: '北京市通州区',
      lat: 39.909,
      lng: 116.656,
      intro: '和朋友们一起，把每个周末过得热气腾腾 🔥'
    },
    friends: [
      { id: 'f1', name: '鄂鄂', location: '通州区', lat: 39.909, lng: 116.656, color: '#FF8FA3', emoji: '🌸' },
      { id: 'f2', name: '尔尔', location: '朝阳区', lat: 39.921, lng: 116.443, color: '#7BD3EA', emoji: '🐧' },
      { id: 'f3', name: '多多', location: '海淀区', lat: 39.959, lng: 116.298, color: '#B9A7F0', emoji: '🦌' },
      { id: 'f4', name: '斯斯', location: '东城区', lat: 39.928, lng: 116.416, color: '#F5C76B', emoji: '🦅' },
      { id: 'f5', name: '准准', location: '西城区', lat: 39.915, lng: 116.366, color: '#F0A8A0', emoji: '🐱' },
      { id: 'f6', name: '格格', location: '丰台区', lat: 39.858, lng: 116.287, color: '#8FBF9F', emoji: '🍵' },
      { id: 'f7', name: '尔尔', location: '昌平区', lat: 40.220, lng: 116.231, color: '#A5C9F0', emoji: '🐰' },
      { id: 'f8', name: '旗旗', location: '顺义区', lat: 40.130, lng: 116.654, color: '#D6B58F', emoji: '🌿' }
    ],
    activities: [
      {
        id: 'a_seed_dinner',
        type: 'dinner',
        title: '🍲 周末家宴·暖锅局',
        location: 'Paddy家（通州区）',
        locationLat: 39.909,
        locationLng: 116.656,
        startTime: sat,
        description: '老规矩，家里开锅！大家选好想吃的菜，记得登记带菜，采购清单我来汇总 🧺',
        creatorId: 'me',
        status: 'ongoing',
        createdAt: Date.now() - 2 * day,
        signups: [
          { friendId: 'me', status: 'yes', note: '主人，负责采购 😎', signedAt: Date.now() - 2 * day },
          { friendId: 'f1', status: 'yes', note: '带鲜切牛肉 🥩', signedAt: Date.now() - 2 * day },
          { friendId: 'f3', status: 'yes', note: '带黄油啤酒 🍺', signedAt: Date.now() - day },
          { friendId: 'f4', status: 'yes', note: '带蛋糕 🎂', signedAt: Date.now() - day },
          { friendId: 'f5', status: 'yes', note: '做一份大沙拉 🥗', signedAt: Date.now() - 8 * hour },
          { friendId: 'f6', status: 'no', note: '出差，下次一定 🙏', signedAt: Date.now() - 6 * hour },
          { friendId: 'f7', status: 'yes', note: '带果酒 🍹', signedAt: Date.now() - 5 * hour },
          { friendId: 'f8', status: 'yes', note: '带菌菇拼盘 🍄', signedAt: Date.now() - 3 * hour },
          { friendId: 'f2', status: 'maybe', note: '看加班情况', signedAt: Date.now() - 2 * hour }
        ],
        comments: [
          { id: 'c1', author: '白敏', authorId: 'f1', text: '我这次带鲜切牛肉，锅底就拜托Paddy啦！', at: Date.now() - 1 * day },
          { id: 'c2', author: '阿凯', authorId: 'f2', text: '能不能早点开饭哈哈，我下班直接过去', at: Date.now() - 6 * hour }
        ],
        dinner: demoDinnerData(),
        photos: demoPhotosData()
      },
      {
        id: 'a_seed_outdoor',
        type: 'outdoor',
        title: '⛰️ 凤凰岭徒步一日',
        location: '凤凰岭自然风景区（海淀区）',
        locationLat: 40.107,
        locationLng: 116.118,
        startTime: sun,
        description: '轻装徒步，全程约8公里，自带水和小零食。晚上回来可以一起吃个饭～',
        creatorId: 'me',
        status: 'ongoing',
        createdAt: Date.now() - 3 * day,
        signups: [
          { friendId: 'me', status: 'yes', note: '开车，可带3人 🚗', signedAt: Date.now() - 3 * day },
          { friendId: 'f1', status: 'yes', note: '', signedAt: Date.now() - 3 * day },
          { friendId: 'f2', status: 'yes', note: '搭Paddy的车', signedAt: Date.now() - 2 * day },
          { friendId: 'f4', status: 'yes', note: '自驾，可带2人', signedAt: Date.now() - 2 * day },
          { friendId: 'f7', status: 'maybe', note: '看天气', signedAt: Date.now() - 1 * day },
          { friendId: 'f3', status: 'no', note: '那天有事 😢', signedAt: Date.now() - 1 * day }
        ],
        comments: [],
        outdoor: demoOutdoorData(),
        photos: []
      },
      {
        id: 'a_seed_group',
        type: 'group',
        title: '🎲 鹅鸭杀之夜',
        location: '地点待定（按大家位置取中）',
        startTime: fri,
        description: '开黑局！地点会根据大家的地址选个居中的场子，谁有推荐也可以直接留言。',
        creatorId: 'me',
        status: 'ongoing',
        createdAt: Date.now() - 4 * day,
        signups: [
          { friendId: 'me', status: 'yes', note: '发起人 🎉', signedAt: Date.now() - 4 * day },
          { friendId: 'f8', status: 'yes', note: '', signedAt: Date.now() - 3 * day },
          { friendId: 'f5', status: 'yes', note: '', signedAt: Date.now() - 3 * day },
          { friendId: 'f7', status: 'yes', note: '', signedAt: Date.now() - 2 * day },
          { friendId: 'f4', status: 'yes', note: '', signedAt: Date.now() - 2 * day },
          { friendId: 'f6', status: 'maybe', note: '', signedAt: Date.now() - 1 * day }
        ],
        comments: [],
        group: demoGroupData(),
        photos: []
      },
      {
        id: 'a_seed_trip',
        type: 'trip',
        title: '🏞️ 古北水镇两日游',
        location: '古北水镇·临水民宿',
        locationLat: 40.631,
        locationLng: 117.143,
        startTime: sat9,
        description: '两天一夜京郊游：司马台长城徒步 + 民宿桌游 + 看日出。大家分工认领一下，费用最后 AA～',
        creatorId: 'me',
        status: 'ongoing',
        createdAt: Date.now() - 5 * day,
        signups: [
          { friendId: 'me', status: 'yes', note: '发起人 🎉', signedAt: Date.now() - 5 * day },
          { friendId: 'f1', status: 'yes', note: '负责订民宿', signedAt: Date.now() - 5 * day },
          { friendId: 'f4', status: 'yes', note: '开车，可带3人 🚗', signedAt: Date.now() - 4 * day },
          { friendId: 'f5', status: 'yes', note: '', signedAt: Date.now() - 4 * day },
          { friendId: 'f7', status: 'yes', note: '', signedAt: Date.now() - 3 * day },
          { friendId: 'f2', status: 'maybe', note: '看排班', signedAt: Date.now() - 2 * day }
        ],
        comments: [],
        trip: demoTripData(),
        photos: []
      },
      {
        id: 'a_seed_ended',
        type: 'outdoor',
        title: '🚴 大运河森林公园骑行',
        location: '通州大运河森林公园集合',
        startTime: Date.now() - 12 * day,
        description: '沿大运河骑行看秋景，往返约20公里。',
        creatorId: 'me',
        status: 'ended',
        createdAt: Date.now() - 15 * day,
        signups: [
          { friendId: 'me', status: 'yes', note: '', signedAt: Date.now() - 15 * day },
          { friendId: 'f1', status: 'yes', note: '', signedAt: Date.now() - 15 * day },
          { friendId: 'f2', status: 'yes', note: '', signedAt: Date.now() - 14 * day },
          { friendId: 'f4', status: 'yes', note: '', signedAt: Date.now() - 14 * day },
          { friendId: 'f7', status: 'yes', note: '', signedAt: Date.now() - 13 * day }
        ],
        comments: [
          { id: 'c3', author: '西西', authorId: 'f7', text: '樱花太美了！下次还去！', at: Date.now() - 11 * day }
        ],
        photos: []
      }
    ]
  }
}

function emptyData() {
  return {
    usersCache: {},
    profile: {
      name: '',
      location: '',
      intro: '和朋友们一起，把每个周末过得热气腾腾 🔥'
    },
    friends: [],
    activities: []
  }
}

function load() {
  return wx.getStorageSync(STORAGE_KEY) || null
}

function save(data, activityId) {
  wx.setStorageSync(STORAGE_KEY, data)
  if (activityId) {
    const act = (data.activities || []).find(function (a) { return a.id === activityId })
    if (act) cloudPushActivity(act)
  }
}

function ensureSeed() {
  const data = load()
  if (!data) {
    // 新用户保留示例活动与示例好友，方便先看看这个应用能做什么
    save(seedData())
    return
  }
  if (upgradeData(data)) {
    save(data)
  }
}

function upgradeData(d) {
  let changed = false
  // 范例活动标题随版本刷新（演示数据，不影响真实活动）
  const SEED_TITLES = {
    a_seed_dinner: '🍲 周末家宴·暖锅局',
    a_seed_outdoor: '⛰️ 凤凰岭徒步一日',
    a_seed_group: '🎲 鹅鸭杀之夜',
    a_seed_trip: '🏞️ 古北水镇两日游',
    a_seed_ended: '🚴 大运河森林公园骑行'
  }
  ;(d.activities || []).forEach(function (a) {
    if (SEED_TITLES[a.id] && a.title !== SEED_TITLES[a.id]) {
      a.title = SEED_TITLES[a.id]
      changed = true
    }
  })
  if (!d.usersCache) {
    d.usersCache = {}
    changed = true
  }
  if (!d.deletedFriendOpenids) {
    d.deletedFriendOpenids = []
    changed = true
  }
  if (!d.deletedActivityIds) {
    d.deletedActivityIds = []
    changed = true
  }
  if (!d.circles) {
    d.circles = []
    changed = true
  }
  if (!d.currentCircleId) {
    d.currentCircleId = ''
    changed = true
  }
  if (d.profile && !d.profile.lat) {
    d.profile.lat = 39.909
    d.profile.lng = 116.656
    changed = true
  }
  ;(d.friends || []).forEach(function (f) {
    if (!f.lat && FRIEND_COORDS[f.id]) {
      f.lat = FRIEND_COORDS[f.id][0]
      f.lng = FRIEND_COORDS[f.id][1]
      changed = true
    }
  })
  ;(d.activities || []).forEach(function (a) {
    if (!a.photos) {
      a.photos = a.id === 'a_seed_dinner' ? demoPhotosData() : []
      changed = true
    }
    if (a.type === 'tablegame') {
      a.type = 'group'
      changed = true
    }
    if (!a.locationLat && ACTIVITY_COORDS[a.id]) {
      a.locationLat = ACTIVITY_COORDS[a.id][0]
      a.locationLng = ACTIVITY_COORDS[a.id][1]
      changed = true
    }
    if (a.type === 'dinner' && !a.dinner) {
      a.dinner = a.id === 'a_seed_dinner' ? demoDinnerData() : { timeSlots: [], dishes: [], bringItems: [] }
      changed = true
    }
    if (a.type === 'outdoor' && !a.outdoor) {
      a.outdoor = a.id === 'a_seed_outdoor' ? demoOutdoorData() : { cars: [], riders: [], gear: [] }
      changed = true
    }
    if (a.type === 'group' && !a.group) {
      a.group = a.id === 'a_seed_group' ? demoGroupData() : { venues: [], finalVenueId: null }
      changed = true
    }
    if (a.type === 'trip' && !a.trip) {
      a.trip = a.id === 'a_seed_trip' ? demoTripData() : { days: [], tasks: [], stays: [], expenses: [] }
      changed = true
    }
  })
  return changed
}

function getData() {
  ensureSeed()
  return load()
}

function getProfile() {
  return getData().profile
}

function updateProfile(patch) {
  const d = getData()
  d.profile = Object.assign({}, d.profile, patch)
  save(d)
}

function getFriends() {
  return getData().friends
}

function getFriend(id) {
  return getFriends().find(function (f) { return f.id === id }) || null
}

function addFriend(info) {
  const d = getData()
  const friend = {
    id: 'f' + Date.now(),
    name: info.name || '新朋友',
    location: info.location || '',
    lat: info.lat || null,
    lng: info.lng || null,
    avatar: info.avatar || '',
    emoji: info.emoji || '🫶',
    color: info.color || '#FFB3A0'
  }
  d.friends.push(friend)
  save(d)
  return friend.id
}

function updateFriend(id, patch) {
  const d = getData()
  const friend = d.friends.find(function (f) { return f.id === id })
  if (friend) {
    Object.assign(friend, patch)
    save(d)
  }
}

function removeFriend(id) {
  const d = getData()
  const target = d.friends.find(function (f) { return f.id === id })
  d.friends = d.friends.filter(function (f) { return f.id !== id })
  if (target && target.openid) {
    if (!d.deletedFriendOpenids) d.deletedFriendOpenids = []
    d.deletedFriendOpenids.push(target.openid)
  }
  save(d)
}

function refreshActivities() {
  const d = getData()
  let changed = false
  const changedIds = []
  d.activities.forEach(function (a) {
    if (a.status === 'ongoing' && a.startTime && a.startTime < Date.now() - 3600000) {
      a.status = 'ended'
      changed = true
      changedIds.push(a.id)
    }
  })
  if (changed) {
    save(d)
    changedIds.forEach(function (id) {
      const act = d.activities.find(function (a) { return a.id === id })
      if (act) cloudPushActivity(act)
    })
  }
}

function getActivities() {
  refreshActivities()
  const d = getData()
  const deleted = d.deletedActivityIds || []
  let list = d.activities.filter(function (a) { return deleted.indexOf(a.id) < 0 })
  const cid = d.currentCircleId
  if (cid) list = list.filter(function (a) { return a.circleId === cid })
  return list
}

function getActivity(id) {
  return getActivities().find(function (a) { return a.id === id }) || null
}

function getActivityByCloudId(cloudId) {
  if (!cloudId) return null
  return getData().activities.find(function (a) { return a.cloudId === cloudId }) || null
}

function getUpcoming() {
  return getActivities().filter(function (a) { return a.status === 'ongoing' })
    .sort(function (a, b) { return a.startTime - b.startTime })
}

function getEnded() {
  return getActivities().filter(function (a) { return a.status === 'ended' })
    .sort(function (a, b) { return b.startTime - a.startTime })
}

function createActivity(info) {
  const d = getData()
  const id = 'a' + Date.now()
  const activity = {
    id: id,
    type: info.type,
    title: info.title,
    circleId: getData().currentCircleId || '',
    dinnerMode: info.dinnerMode || 'home',
    location: info.location || '',
    locationAddress: info.locationAddress || '',
    locationLat: info.locationLat || null,
    locationLng: info.locationLng || null,
    startTime: info.startTime,
    description: info.description || '',
    invitedOpenids: info.invitedOpenids || [],
    dinner: info.type === 'dinner' ? { timeSlots: [], dishes: [], bringItems: [] } : null,
    photos: [],
    creatorId: currentUid(),
    status: 'ongoing',
    createdAt: Date.now(),
    photos: [],
    signups: [
      { friendId: currentUid(), status: 'yes', note: '发起人 🎉', signedAt: Date.now() }
    ],
    comments: []
  }
  ;(info.aiMenu || []).forEach(function (name) {
    if (!activity.dinner) return
    if (!activity.dinner.dishes.some(function (x) { return x.name === name })) {
      activity.dinner.dishes.push({ id: 'd' + Date.now() + Math.floor(Math.random() * 1000), name: name, voters: [] })
    }
  })
  d.activities.unshift(activity)
  save(d, id)
  return id
}

function removeActivity(activityId) {
  const d = getData()
  const before = d.activities.length
  d.activities = d.activities.filter(function (a) { return a.id !== activityId })
  if (d.activities.length !== before) {
    if (!d.deletedActivityIds) d.deletedActivityIds = []
    d.deletedActivityIds.push(activityId)
    save(d)
    return true
  }
  return false
}

function markEnded(activityId) {
  const d = getData()
  const activity = d.activities.find(function (a) { return a.id === activityId })
  if (!activity) return false
  activity.status = 'ended'
  save(d, activityId)
  return true
}

function isCreator(activity) {
  if (!activity) return false
  const uid = currentUid()
  const openid = (getProfile() && getProfile().openid) || ''
  return activity.creatorId === uid || (!!activity.creatorOpenid && activity.creatorOpenid === openid)
}

function countMyStats() {
  const d = getData()
  const uid = currentUid()
  const openid = (d.profile && d.profile.openid) || ''
  const deleted = d.deletedActivityIds || []
  const list = d.activities.filter(function (a) { return deleted.indexOf(a.id) < 0 })
  let created = 0
  let joined = 0
  let maybe = 0
  let upcoming = 0
  list.forEach(function (a) {
    const isCreator = a.creatorId === uid || (!!a.creatorOpenid && a.creatorOpenid === openid)
    if (isCreator) created++
    const my = mySignup(a)
    if (!my) return
    if (my.status === 'yes') joined++
    if (my.status === 'maybe') maybe++
    if (a.status === 'ongoing') upcoming++
  })
  return { created: created, joined: joined, maybe: maybe, upcoming: upcoming }
}

function uniqueId(prefix) {
  return prefix + Date.now() + '-' + Math.random().toString(36).slice(2, 8)
}

// “再来一场”：复制活动配置生成新活动（时间顺延一周，报名清空，保留菜单/行程/场馆结构）
function duplicateActivity(activityId) {
  const d = getData()
  const src = d.activities.find(function (a) { return a.id === activityId })
  if (!src) return null
  const id = 'a' + Date.now()
  const uid = currentUid()
  const week = 7 * 24 * 3600000
  const base = (src.startTime ? src.startTime + week : Date.now() + week)
  const clone = {
    id: id,
    type: src.type,
    title: src.title,
    circleId: d.currentCircleId || src.circleId || '',
    dinnerMode: src.dinnerMode || 'home',
    location: src.location || '',
    locationAddress: src.locationAddress || '',
    locationLat: src.locationLat || null,
    locationLng: src.locationLng || null,
    startTime: base,
    description: src.description || '',
    invitedOpenids: [],
    creatorId: uid,
    status: 'ongoing',
    createdAt: Date.now(),
    signups: [
      { friendId: uid, status: 'yes', note: '发起人 🎉', signedAt: Date.now() }
    ]
  }
  if (src.type === 'dinner') {
    clone.dinner = {
      timeSlots: (src.dinner && src.dinner.timeSlots || []).map(function (s) {
        return { id: uniqueId('ts'), label: s.label, votes: [uid] }
      }),
      dishes: (src.dinner && src.dinner.dishes || []).map(function (x) {
        return { id: uniqueId('d'), name: x.name, voters: [uid] }
      }),
      bringItems: []
    }
  } else if (src.type === 'outdoor') {
    clone.outdoor = {
      cars: (src.outdoor && src.outdoor.cars || []).map(function (c) {
        return { id: uniqueId('car'), driverId: uid, seats: c.seats || 3, note: '' }
      }),
      riders: [],
      gear: (src.outdoor && src.outdoor.gear || []).map(function (g) {
        return { id: uniqueId('g'), name: g.name, ownerIds: [uid] }
      })
    }
  } else if (src.type === 'group') {
    clone.group = {
      finalVenueId: null,
      venues: (src.group && src.group.venues || []).map(function (v) {
        return Object.assign({}, v, { id: uniqueId('v'), votes: [uid], creatorId: uid })
      })
    }
  } else if (src.type === 'trip') {
    clone.trip = {
      days: JSON.parse(JSON.stringify((src.trip && src.trip.days) || [])),
      tasks: (src.trip && src.trip.tasks || []).map(function (t) {
        return { id: uniqueId('t'), name: t.name, ownerId: null }
      }),
      stays: JSON.parse(JSON.stringify((src.trip && src.trip.stays) || [])),
      expenses: []
    }
  }
  d.activities.unshift(clone)
  save(d, id)
  return id
}

function updateActivity(activityId, info) {
  const d = getData()
  const activity = d.activities.find(function (a) { return a.id === activityId })
  if (!activity) return false
  activity.type = info.type || activity.type
  activity.dinnerMode = info.dinnerMode || activity.dinnerMode || 'home'
  activity.title = info.title
  activity.location = info.location || ''
  activity.locationAddress = info.locationAddress || ''
  activity.locationLat = info.locationLat || null
  activity.locationLng = info.locationLng || null
  activity.startTime = info.startTime
  activity.description = info.description || ''
  save(d, activityId)
  return true
}

function addPhoto(activityId, src) {
  const d = getData()
  const activity = d.activities.find(function (a) { return a.id === activityId })
  if (!activity || !src) return
  if (!activity.photos) activity.photos = []
  activity.photos.push({
    id: 'p' + Date.now(),
    src: src,
    likes: [],
    dislikes: [],
    createdAt: Date.now()
  })
  save(d, activityId)
}

function togglePhotoVote(activityId, photoId, type) {
  const d = getData()
  const activity = d.activities.find(function (a) { return a.id === activityId })
  if (!activity) return
  const photo = (activity.photos || []).find(function (p) { return p.id === photoId })
  if (!photo) return
  if (!photo.likes) photo.likes = []
  if (!photo.dislikes) photo.dislikes = []
  if (type === 'like') {
    const i = photo.likes.indexOf(currentUid())
    if (i >= 0) {
      photo.likes.splice(i, 1)
    } else {
      photo.likes.push(currentUid())
      const j = photo.dislikes.indexOf(currentUid())
      if (j >= 0) photo.dislikes.splice(j, 1)
    }
  } else {
    const i = photo.dislikes.indexOf(currentUid())
    if (i >= 0) {
      photo.dislikes.splice(i, 1)
    } else {
      photo.dislikes.push(currentUid())
      const j = photo.likes.indexOf(currentUid())
      if (j >= 0) photo.likes.splice(j, 1)
    }
  }
  save(d, activityId)
}

function mySignup(activity) {
  return (activity.signups || []).find(function (s) { return s.friendId === currentUid() }) || null
}

function signup(activityId, status, note) {
  const d = getData()
  const activity = d.activities.find(function (a) { return a.id === activityId })
  if (!activity) return
  const idx = activity.signups.findIndex(function (s) { return s.friendId === currentUid() })
  const record = { friendId: currentUid(), status: status, note: note || '', signedAt: Date.now() }
  if (idx >= 0) {
    activity.signups[idx] = record
  } else {
    activity.signups.push(record)
  }
  save(d, activityId)
}

function addComment(activityId, text) {
  const d = getData()
  const activity = d.activities.find(function (a) { return a.id === activityId })
  if (!activity || !text || !text.trim()) return false
  if (!activity.comments) activity.comments = []
  activity.comments.push({
    id: 'c' + Date.now(),
    author: (d.profile && d.profile.name) || '朋友',
    authorId: currentUid(),
    text: text.trim(),
    at: Date.now()
  })
  save(d, activityId)
  return true
}

function getDinner(activity) {
  if (!activity.dinner) {
    activity.dinner = { timeSlots: [], dishes: [], bringItems: [] }
  }
  return activity.dinner
}

function addTimeSlot(activityId, label) {
  const d = getData()
  const activity = d.activities.find(function (a) { return a.id === activityId })
  if (!activity || !label || !label.trim()) return
  const dinner = getDinner(activity)
  dinner.timeSlots.push({ id: 'ts' + Date.now(), label: label.trim(), votes: [currentUid()] })
  save(d, activityId)
}

function removeTimeSlot(activityId, slotId) {
  const d = getData()
  const activity = d.activities.find(function (a) { return a.id === activityId })
  if (!activity || !isCreator(activity)) return
  const dinner = getDinner(activity)
  dinner.timeSlots = dinner.timeSlots.filter(function (s) { return s.id !== slotId })
  save(d, activityId)
}

function toggleTimeVote(activityId, slotId) {
  const d = getData()
  const activity = d.activities.find(function (a) { return a.id === activityId })
  if (!activity) return
  const slot = getDinner(activity).timeSlots.find(function (s) { return s.id === slotId })
  if (!slot) return
  const idx = slot.votes.indexOf(currentUid())
  if (idx >= 0) {
    slot.votes.splice(idx, 1)
  } else {
    slot.votes.push(currentUid())
  }
  save(d, activityId)
}

function addDish(activityId, name) {
  const d = getData()
  const activity = d.activities.find(function (a) { return a.id === activityId })
  if (!activity || !name || !name.trim()) return
  const dinner = getDinner(activity)
  if (dinner.dishes.some(function (x) { return x.name === name.trim() })) return
  dinner.dishes.push({ id: 'd' + Date.now(), name: name.trim(), voters: [currentUid()] })
  save(d, activityId)
}

function removeDish(activityId, dishId) {
  const d = getData()
  const activity = d.activities.find(function (a) { return a.id === activityId })
  if (!activity || !isCreator(activity)) return
  const dinner = getDinner(activity)
  dinner.dishes = dinner.dishes.filter(function (x) { return x.id !== dishId })
  save(d, activityId)
}

function toggleDishVote(activityId, dishId) {
  const d = getData()
  const activity = d.activities.find(function (a) { return a.id === activityId })
  if (!activity) return
  const dish = getDinner(activity).dishes.find(function (x) { return x.id === dishId })
  if (!dish) return
  const idx = dish.voters.indexOf(currentUid())
  if (idx >= 0) {
    dish.voters.splice(idx, 1)
  } else {
    dish.voters.push(currentUid())
  }
  save(d, activityId)
}

function addBringItem(activityId, item) {
  const d = getData()
  const activity = d.activities.find(function (a) { return a.id === activityId })
  if (!activity || !item || !item.trim()) return
  const dinner = getDinner(activity)
  dinner.bringItems.push({ id: 'bi' + Date.now(), friendId: currentUid(), item: item.trim() })
  save(d, activityId)
}

function removeBringItem(activityId, itemId) {
  const d = getData()
  const activity = d.activities.find(function (a) { return a.id === activityId })
  if (!activity) return
  const dinner = getDinner(activity)
  const item = dinner.bringItems.find(function (x) { return x.id === itemId })
  if (item && item.friendId === currentUid()) {
    dinner.bringItems = dinner.bringItems.filter(function (x) { return x.id !== itemId })
    save(d, activityId)
  }
}

function getOutdoor(activity) {
  if (!activity.outdoor) {
    activity.outdoor = { cars: [], riders: [], gear: [] }
  }
  return activity.outdoor
}

function addCar(activityId, seats) {
  const d = getData()
  const activity = d.activities.find(function (a) { return a.id === activityId })
  if (!activity || !seats) return
  const outdoor = getOutdoor(activity)
  if (outdoor.cars.some(function (c) { return c.driverId === currentUid() })) return
  outdoor.cars.push({ id: 'car' + Date.now(), driverId: currentUid(), seats: seats, note: '' })
  save(d, activityId)
}

function removeCar(activityId, carId) {
  const d = getData()
  const activity = d.activities.find(function (a) { return a.id === activityId })
  if (!activity) return
  const outdoor = getOutdoor(activity)
  const car = outdoor.cars.find(function (c) { return c.id === carId })
  if (car && car.driverId === currentUid()) {
    outdoor.cars = outdoor.cars.filter(function (c) { return c.id !== carId })
    save(d, activityId)
  }
}

function toggleRider(activityId) {
  const d = getData()
  const activity = d.activities.find(function (a) { return a.id === activityId })
  if (!activity) return
  const outdoor = getOutdoor(activity)
  const idx = outdoor.riders.indexOf(currentUid())
  if (idx >= 0) {
    outdoor.riders.splice(idx, 1)
  } else {
    outdoor.riders.push(currentUid())
  }
  save(d, activityId)
}

function addGear(activityId, name) {
  const d = getData()
  const activity = d.activities.find(function (a) { return a.id === activityId })
  if (!activity || !name || !name.trim()) return
  const outdoor = getOutdoor(activity)
  if (outdoor.gear.some(function (g) { return g.name === name.trim() })) return
  outdoor.gear.push({ id: 'g' + Date.now(), name: name.trim(), ownerIds: [currentUid()] })
  save(d, activityId)
}

function removeGear(activityId, gearId) {
  const d = getData()
  const activity = d.activities.find(function (a) { return a.id === activityId })
  if (!activity || !isCreator(activity)) return
  const outdoor = getOutdoor(activity)
  outdoor.gear = outdoor.gear.filter(function (g) { return g.id !== gearId })
  save(d, activityId)
}

function toggleGearOwner(activityId, gearId) {
  const d = getData()
  const activity = d.activities.find(function (a) { return a.id === activityId })
  if (!activity) return
  const gear = getOutdoor(activity).gear.find(function (g) { return g.id === gearId })
  if (!gear) return
  const idx = gear.ownerIds.indexOf(currentUid())
  if (idx >= 0) {
    gear.ownerIds.splice(idx, 1)
  } else {
    gear.ownerIds.push(currentUid())
  }
  save(d, activityId)
}

function getGroup(activity) {
  if (!activity.group) {
    activity.group = { venues: [], finalVenueId: null }
  }
  return activity.group
}

function addVenue(activityId, info) {
  const d = getData()
  const activity = d.activities.find(function (a) { return a.id === activityId })
  if (!activity || !info || !info.name) return
  const group = getGroup(activity)
  if (group.venues.some(function (v) { return v.name === info.name })) return
  group.venues.push({
    id: 'v' + Date.now(),
    name: info.name.trim(),
    address: info.address || '',
    lat: info.lat || null,
    lng: info.lng || null,
    votes: [currentUid()],
    creatorId: currentUid()
  })
  save(d, activityId)
}

function removeVenue(activityId, venueId) {
  const d = getData()
  const activity = d.activities.find(function (a) { return a.id === activityId })
  if (!activity) return
  const group = getGroup(activity)
  const venue = group.venues.find(function (v) { return v.id === venueId })
  if (venue && venue.creatorId === currentUid()) {
    group.venues = group.venues.filter(function (v) { return v.id !== venueId })
    if (group.finalVenueId === venueId) group.finalVenueId = null
    save(d, activityId)
  }
}

function toggleVenueVote(activityId, venueId) {
  const d = getData()
  const activity = d.activities.find(function (a) { return a.id === activityId })
  if (!activity) return
  const venue = getGroup(activity).venues.find(function (v) { return v.id === venueId })
  if (!venue) return
  const idx = venue.votes.indexOf(currentUid())
  if (idx >= 0) {
    venue.votes.splice(idx, 1)
  } else {
    venue.votes.push(currentUid())
  }
  save(d, activityId)
}

function setFinalVenue(activityId, venueId) {
  const d = getData()
  const activity = d.activities.find(function (a) { return a.id === activityId })
  if (!activity) return
  const group = getGroup(activity)
  group.finalVenueId = group.finalVenueId === venueId ? null : venueId
  save(d, activityId)
}

function getTrip(activity) {
  if (!activity.trip) {
    activity.trip = { days: [], tasks: [], stays: [], expenses: [] }
  }
  return activity.trip
}

function addTripDay(activityId, title) {
  const d = getData()
  const activity = d.activities.find(function (a) { return a.id === activityId })
  if (!activity || !title || !title.trim()) return null
  const trip = getTrip(activity)
  trip.days.push({ id: 'day' + Date.now(), title: title.trim(), items: [] })
  save(d, activityId)
  return trip.days[trip.days.length - 1].id
}

function addTripItem(activityId, dayId, time, content) {
  const d = getData()
  const activity = d.activities.find(function (a) { return a.id === activityId })
  if (!activity || !content || !content.trim()) return
  const trip = getTrip(activity)
  const day = trip.days.find(function (x) { return x.id === dayId })
  if (!day) return
  day.items.push({ id: 'i' + Date.now(), time: time || '全天', content: content.trim() })
  save(d, activityId)
}

function removeTripItem(activityId, dayId, itemId) {
  const d = getData()
  const activity = d.activities.find(function (a) { return a.id === activityId })
  if (!activity) return
  const trip = getTrip(activity)
  const day = trip.days.find(function (x) { return x.id === dayId })
  if (!day) return
  day.items = day.items.filter(function (it) { return it.id !== itemId })
  save(d, activityId)
}

function addTask(activityId, name) {
  const d = getData()
  const activity = d.activities.find(function (a) { return a.id === activityId })
  if (!activity || !name || !name.trim()) return
  const trip = getTrip(activity)
  if (trip.tasks.some(function (t) { return t.name === name.trim() })) return
  trip.tasks.push({ id: 't' + Date.now(), name: name.trim(), ownerId: null })
  save(d, activityId)
}

function removeTask(activityId, taskId) {
  const d = getData()
  const activity = d.activities.find(function (a) { return a.id === activityId })
  if (!activity || !isCreator(activity)) return
  const trip = getTrip(activity)
  trip.tasks = trip.tasks.filter(function (t) { return t.id !== taskId })
  save(d, activityId)
}

function toggleTaskOwner(activityId, taskId) {
  const d = getData()
  const activity = d.activities.find(function (a) { return a.id === activityId })
  if (!activity) return
  const task = getTrip(activity).tasks.find(function (t) { return t.id === taskId })
  if (!task) return
  if (task.ownerId && task.ownerId !== currentUid()) return
  task.ownerId = task.ownerId ? null : currentUid()
  save(d, activityId)
}

function addStay(activityId, info) {
  const d = getData()
  const activity = d.activities.find(function (a) { return a.id === activityId })
  if (!activity || !info || !info.name) return
  const trip = getTrip(activity)
  trip.stays.push({
    id: 's' + Date.now(),
    name: info.name.trim(),
    cost: Number(info.cost) || 0,
    nights: Number(info.nights) || 1,
    ownerId: currentUid()
  })
  save(d, activityId)
}

function removeStay(activityId, stayId) {
  const d = getData()
  const activity = d.activities.find(function (a) { return a.id === activityId })
  if (!activity) return
  const trip = getTrip(activity)
  const stay = trip.stays.find(function (s) { return s.id === stayId })
  if (stay && stay.ownerId === currentUid()) {
    trip.stays = trip.stays.filter(function (s) { return s.id !== stayId })
    save(d, activityId)
  }
}

function addExpense(activityId, info) {
  const d = getData()
  const activity = d.activities.find(function (a) { return a.id === activityId })
  if (!activity || !info || !info.item) return
  const trip = getTrip(activity)
  trip.expenses.push({
    id: 'e' + Date.now(),
    item: info.item.trim(),
    amount: Number(info.amount) || 0,
    payerId: currentUid()
  })
  save(d, activityId)
}

// AI 助手：调用 ai 云函数（活动策划 / 行程 / 小记 / 团体推荐）
function aiCall(action, payload, callback) {
  const done = function (ok, data, error) {
    if (callback) callback(ok, data, error)
  }
  if (!wx.cloud || !wx.cloud.callFunction) {
    done(false, null, '需要联网才能使用 AI')
    return
  }
  wx.cloud.callFunction({
    name: 'ai',
    data: Object.assign({ action: action }, payload || {})
  })
    .then(function (res) {
      const r = res.result || {}
      if (r.ok) {
        done(true, r.data)
      } else {
        done(false, null, r.error || 'AI 生成失败')
      }
    })
    .catch(function (e) {
      done(false, null, ((e && (e.errMsg || e.message)) || '网络异常'))
    })
}

function removeExpense(activityId, expenseId) {
  const d = getData()
  const activity = d.activities.find(function (a) { return a.id === activityId })
  if (!activity) return
  const trip = getTrip(activity)
  const expense = trip.expenses.find(function (e) { return e.id === expenseId })
  if (expense && expense.payerId === currentUid()) {
    trip.expenses = trip.expenses.filter(function (e) { return e.id !== expenseId })
    save(d, activityId)
  }
}

function isPaddyHome(location) {
  if (!location) return false
  const text = String(location).toLowerCase()
  return text.indexOf('周鹏') >= 0 || (text.indexOf('paddy') >= 0 && text.indexOf('家') >= 0)
}

function addPrivateMenuToDinner(activityId) {
  const d = getData()
  const activity = d.activities.find(function (a) { return a.id === activityId })
  if (!activity || activity.type !== 'dinner') return 0
  const dinner = getDinner(activity)
  const existing = {}
  ;(dinner.dishes || []).forEach(function (x) { existing[x.name] = true })
  let added = 0
  privateMenu.allPrivateDishes().forEach(function (name) {
    if (!existing[name]) {
      dinner.dishes.push({ id: 'd' + Date.now() + added, name: name, voters: [] })
      added++
    }
  })
  if (added > 0) save(d, activityId)
  return added
}

// 私房菜单单道菜加入点菜清单（不自动投票，保持与一键加入一致）
function addPrivateDish(activityId, name) {
  const d = getData()
  const activity = d.activities.find(function (a) { return a.id === activityId })
  if (!activity || !name || !name.trim()) return false
  const dinner = getDinner(activity)
  const key = name.trim()
  if (dinner.dishes.some(function (x) { return x.name === key })) return false
  dinner.dishes.push({ id: 'd' + Date.now() + '-' + Math.random().toString(36).slice(2, 7), name: key, voters: [] })
  save(d, activityId)
  return true
}

function countConfirmed(activity) {
  return (activity.signups || []).filter(function (s) { return s.status === 'yes' }).length
}

function countMaybe(activity) {
  return (activity.signups || []).filter(function (s) { return s.status === 'maybe' }).length
}

function myStatusText(activity) {
  const s = mySignup(activity)
  if (!s || !SIGNUP_META[s.status]) return ''
  return SIGNUP_META[s.status].icon + ' ' + SIGNUP_META[s.status].label
}

function getMySignups() {
  return getUpcoming().filter(function (a) {
    const s = mySignup(a)
    return s && (s.status === 'yes' || s.status === 'maybe')
  })
}

function resetDemo() {
  wx.removeStorageSync(STORAGE_KEY)
  save(seedData())
}

function isOnboardDone() {
  return !!wx.getStorageSync(ONBOARD_KEY)
}

function markOnboardDone() {
  wx.setStorageSync(ONBOARD_KEY, true)
}

function currentUid() {
  const profile = getProfile()
  return profile.openid || 'me'
}

function getCachedUser(uid) {
  if (!uid) return null
  const d = getData()
  const cache = d.usersCache || {}
  const u = cache[uid]
  return u ? { name: u.name, avatar: u.avatar, color: '#D9CFC4', emoji: '🙂' } : null
}

function cloudPushActivity(activity) {
  if (!activity || !wx.cloud || !wx.cloud.callFunction) return
  const profile = getProfile()
  if (!profile.openid) return
  let payload = null
  try {
    payload = JSON.parse(JSON.stringify(activity))
  } catch (e) {
    return
  }
  delete payload.cloudId
  payload.localId = activity.id
  payload.creatorOpenid = payload.creatorOpenid || profile.openid
  payload.creatorName = payload.creatorName || profile.name || '朋友'
  wx.cloud.callFunction({
    name: 'activity',
    // 优先用活动自己的圈子，避免跨圈子查看/互动时把活动推错圈子
    data: { action: 'save', activity: payload, circleId: payload.circleId || profile.currentCircleId || '' }
  }).then(function (res) {
    const r = res.result || {}
    if (r.code === 'NEED_CIRCLE') {
      setCloudStatus({ needsCircle: true, lastOk: false, lastError: '需要先加入圈子', lastSyncAt: Date.now() })
      return
    }
    const cloudId = res.result && res.result._id
    if (cloudId && !activity.cloudId) {
      activity.cloudId = cloudId
      wx.setStorageSync(STORAGE_KEY, getData())
    }
  }).catch(function (e) {
    console.error('[sync] push failed', e)
    setCloudStatus({ lastOk: false, lastError: '[推送活动] ' + ((e && (e.errMsg || e.message)) || '失败'), lastSyncAt: Date.now() })
  })
}

function pullActivities(callback) {
  const done = function (ok) {
    if (callback) callback(ok)
  }
  if (!wx.cloud || !wx.cloud.callFunction) {
    done(false)
    return
  }
  const profile = getProfile()
  if (!profile.openid) {
    done(false)
    return
  }
  if (!profile.currentCircleId) {
    done(false)
    return
  }
  wx.cloud.callFunction({ name: 'activity', data: { action: 'list', circleId: profile.currentCircleId || '' } })
    .then(function (res) {
      const r = res.result || {}
      if (r.code === 'NEED_CIRCLE') {
        setCloudStatus({ needsCircle: true, lastOk: false, lastError: '需要先加入圈子', lastSyncAt: Date.now() })
        done(false)
        return
      }
      const cloudActs = r.activities || []
      const d = getData()
      const merged = []
      const seenIds = {}
      cloudActs.forEach(function (doc) {
        const act = Object.assign({}, doc)
        const localId = doc.localId || doc._id
        if ((d.deletedActivityIds || []).indexOf(localId) >= 0) return
        act.id = localId
        act.cloudId = doc._id
        delete act._id
        delete act._openid
        delete act.localId
        delete act.updatedAt
        // 历史遗留的重复云端文档（同一 localId）只保留一份并合并
        if (seenIds[localId]) {
          const idx = merged.findIndex(function (m) { return m.id === localId })
          if (idx >= 0) {
            merged[idx] = sanitizeForStorage(mergeActivity(merged[idx], act))
          }
          return
        }
        seenIds[localId] = true
        const existing = d.activities.find(function (a) { return a.id === localId })
        if (existing) {
          merged.push(sanitizeForStorage(mergeActivity(existing, act)))
        } else {
          merged.push(sanitizeForStorage(act))
        }
      })
      d.activities.forEach(function (a) {
        if (!merged.find(function (m) { return m.id === a.id })) {
          merged.push(a)
        }
      })
      d.activities = merged
      save(d)
      setCloudStatus({ lastOk: true, lastError: '', lastSyncAt: Date.now() })
      done(true)
    })
    .catch(function (e) {
      console.error('[sync] pull failed', e)
      setCloudStatus({ lastOk: false, lastError: '[拉取活动] ' + ((e && (e.errMsg || e.message)) || '失败'), lastSyncAt: Date.now() })
      done(false)
    })
}

function sanitizeForStorage(obj) {
  try {
    return JSON.parse(JSON.stringify(obj))
  } catch (e) {
    return obj
  }
}

function mergeStringArray(localArr, remoteArr) {
  const set = {}
  ;(localArr || []).forEach(function (x) {
    if (x !== null && x !== undefined) set[x] = true
  })
  ;(remoteArr || []).forEach(function (x) {
    if (x !== null && x !== undefined) set[x] = true
  })
  return Object.keys(set)
}

function mergeById(localList, remoteList, key, arrayKeys) {
  const map = {}
  ;(localList || []).forEach(function (it) {
    if (it && it[key] !== null && it[key] !== undefined) map[it[key]] = it
  })
  ;(remoteList || []).forEach(function (it) {
    if (it && it[key] !== null && it[key] !== undefined) {
      const local = map[it[key]]
      if (local) {
        const merged = Object.assign({}, local, it)
        ;(arrayKeys || []).forEach(function (k) {
          merged[k] = mergeStringArray(local[k], it[k])
        })
        map[it[key]] = merged
      } else {
        map[it[key]] = it
      }
    }
  })
  return Object.keys(map).map(function (k) { return map[k] })
}

function mergeActivity(local, remote) {
  const merged = Object.assign({}, local, remote)
  merged.signups = mergeById(local.signups, remote.signups, 'friendId', [])
  merged.comments = mergeById(local.comments, remote.comments, 'id', [])
  merged.photos = mergeById(local.photos, remote.photos, 'id', ['likes', 'dislikes'])

  if (local.dinner || remote.dinner) {
    merged.dinner = Object.assign({}, local.dinner || {}, remote.dinner || {})
    merged.dinner.timeSlots = mergeById(local.dinner && local.dinner.timeSlots, remote.dinner && remote.dinner.timeSlots, 'id', ['votes'])
    merged.dinner.dishes = mergeById(local.dinner && local.dinner.dishes, remote.dinner && remote.dinner.dishes, 'id', ['voters'])
    merged.dinner.bringItems = mergeById(local.dinner && local.dinner.bringItems, remote.dinner && remote.dinner.bringItems, 'id', [])
  }
  if (local.outdoor || remote.outdoor) {
    merged.outdoor = Object.assign({}, local.outdoor || {}, remote.outdoor || {})
    merged.outdoor.cars = mergeById(local.outdoor && local.outdoor.cars, remote.outdoor && remote.outdoor.cars, 'id', [])
    merged.outdoor.riders = mergeStringArray(local.outdoor && local.outdoor.riders, remote.outdoor && remote.outdoor.riders)
    merged.outdoor.gear = mergeById(local.outdoor && local.outdoor.gear, remote.outdoor && remote.outdoor.gear, 'id', ['ownerIds'])
  }
  if (local.group || remote.group) {
    merged.group = Object.assign({}, local.group || {}, remote.group || {})
    merged.group.venues = mergeById(local.group && local.group.venues, remote.group && remote.group.venues, 'id', ['votes'])
  }
  if (local.trip || remote.trip) {
    merged.trip = Object.assign({}, local.trip || {}, remote.trip || {})
    merged.trip.days = mergeById(local.trip && local.trip.days, remote.trip && remote.trip.days, 'id', [])
    merged.trip.days = (merged.trip.days || []).map(function (day) {
      const lday = (local.trip && local.trip.days || []).find(function (x) { return x.id === day.id })
      const rday = (remote.trip && remote.trip.days || []).find(function (x) { return x.id === day.id })
      if (lday && rday) {
        day.items = mergeById(lday.items, rday.items, 'id', [])
      }
      return day
    })
    merged.trip.tasks = mergeById(local.trip && local.trip.tasks, remote.trip && remote.trip.tasks, 'id', [])
    merged.trip.stays = mergeById(local.trip && local.trip.stays, remote.trip && remote.trip.stays, 'id', [])
    merged.trip.expenses = mergeById(local.trip && local.trip.expenses, remote.trip && remote.trip.expenses, 'id', [])
  }
  return merged
}

function syncLocalToCloud() {
  if (!wx.cloud || !wx.cloud.callFunction) return
  const profile = getProfile()
  if (!profile.openid) return
  const d = getData()
  ;(d.activities || []).forEach(function (a) {
    if (!a.circleId) return
    cloudPushActivity(a)
  })
}

function pullUsers(callback) {
  const done = function (ok) {
    if (callback) callback(ok)
  }
  if (!wx.cloud || !wx.cloud.callFunction) {
    done(false)
    return
  }
  const profile = getProfile()
  if (!profile.openid) {
    done(false)
    return
  }
  if (!profile.currentCircleId) {
    done(false)
    return
  }
  wx.cloud.callFunction({ name: 'login', data: { action: 'listUsers', circleId: getProfile().currentCircleId || '' } })
    .then(function (res) {
      const r = res.result || {}
      if (r.code === 'NEED_CIRCLE') {
        setCloudStatus({ needsCircle: true, lastOk: false, lastError: '需要先加入圈子', lastSyncAt: Date.now() })
        done(false)
        return
      }
      const list = r.users || []
      const cache = {}
      list.forEach(function (u) {
        if (u.openid) cache[u.openid] = { name: u.name || '微信用户', avatar: u.avatar || '' }
      })
      const d = getData()
      d.usersCache = cache
      mergeCloudUsersIntoFriends(d, list)
      save(d)
      setCloudStatus({ lastOk: true, lastError: '', lastSyncAt: Date.now() })
      done(true)
    })
    .catch(function (e) {
      console.error('[sync] pull users failed', e)
      setCloudStatus({ lastOk: false, lastError: '[拉取好友] ' + ((e && (e.errMsg || e.message)) || '失败'), lastSyncAt: Date.now() })
      done(false)
    })
}

// 把云端已登录的朋友合并进本地好友列表：
// 1. 已绑定 openid 的好友 → 同步最新昵称/头像/位置
// 2. 手动添加但未绑定账号的好友 → 按唯一名字关联上真实账号
// 3. 其余已登录用户 → 自动加入好友列表（被删除过的不会重复出现）
function mergeCloudUsersIntoFriends(d, users) {
  const friends = d.friends || []
  const tombstones = d.deletedFriendOpenids || []
  const myOpenid = (d.profile && d.profile.openid) || ''
  let changed = false

  users.forEach(function (u) {
    if (!u.openid || u.openid === myOpenid) return

    const byOpenid = friends.find(function (f) { return f.openid === u.openid })
    if (byOpenid) {
      let fChanged = false
      if (u.name && byOpenid.name !== u.name) { byOpenid.name = u.name; fChanged = true }
      if (u.avatar && byOpenid.avatar !== u.avatar) { byOpenid.avatar = u.avatar; fChanged = true }
      if (u.location && !byOpenid.location) { byOpenid.location = u.location; fChanged = true }
      if (u.lat && !byOpenid.lat) { byOpenid.lat = u.lat; byOpenid.lng = u.lng; fChanged = true }
      changed = changed || fChanged
      return
    }

    const manual = friends.filter(function (f) { return !f.openid && f.name === u.name })
    if (manual.length === 1) {
      manual[0].openid = u.openid
      if (u.avatar) manual[0].avatar = u.avatar
      if (u.location && !manual[0].location) manual[0].location = u.location
      if (u.lat && !manual[0].lat) { manual[0].lat = u.lat; manual[0].lng = u.lng }
      const ti = tombstones.indexOf(u.openid)
      if (ti >= 0) tombstones.splice(ti, 1)
      changed = true
      return
    }

    if (tombstones.indexOf(u.openid) >= 0) return

    friends.push({
      id: 'u_' + u.openid,
      openid: u.openid,
      name: u.name || '微信用户',
      location: u.location || '',
      lat: u.lat || null,
      lng: u.lng || null,
      avatar: u.avatar || '',
      emoji: '🫶',
      color: '#8FD0FF',
      auto: true
    })
    changed = true
  })

  if (changed) {
    d.friends = friends
    d.deletedFriendOpenids = tombstones
  }
  return changed
}

function migrateMeToOpenid(openid) {
  if (!openid) return
  const d = getData()
  let changed = false
  ;(d.activities || []).forEach(function (a) {
    ;(a.signups || []).forEach(function (s) {
      if (s.friendId === 'me') {
        s.friendId = openid
        changed = true
      }
    })
    ;(a.photos || []).forEach(function (p) {
      if (p.likes) {
        p.likes = p.likes.map(function (x) { return x === 'me' ? openid : x })
        changed = true
      }
      if (p.dislikes) {
        p.dislikes = p.dislikes.map(function (x) { return x === 'me' ? openid : x })
        changed = true
      }
    })
    if (a.dinner) {
      ;(a.dinner.timeSlots || []).forEach(function (s) {
        if (s.votes) {
          s.votes = s.votes.map(function (x) { return x === 'me' ? openid : x })
          changed = true
        }
      })
      ;(a.dinner.dishes || []).forEach(function (dish) {
        if (dish.voters) {
          dish.voters = dish.voters.map(function (x) { return x === 'me' ? openid : x })
          changed = true
        }
      })
      ;(a.dinner.bringItems || []).forEach(function (it) {
        if (it.friendId === 'me') {
          it.friendId = openid
          changed = true
        }
      })
    }
    if (a.outdoor) {
      ;(a.outdoor.cars || []).forEach(function (c) {
        if (c.driverId === 'me') {
          c.driverId = openid
          changed = true
        }
      })
      if (a.outdoor.riders) {
        a.outdoor.riders = a.outdoor.riders.map(function (x) { return x === 'me' ? openid : x })
        changed = true
      }
      ;(a.outdoor.gear || []).forEach(function (g) {
        if (g.ownerIds) {
          g.ownerIds = g.ownerIds.map(function (x) { return x === 'me' ? openid : x })
          changed = true
        }
      })
    }
    if (a.group) {
      ;(a.group.venues || []).forEach(function (v) {
        if (v.votes) {
          v.votes = v.votes.map(function (x) { return x === 'me' ? openid : x })
          changed = true
        }
        if (v.creatorId === 'me') {
          v.creatorId = openid
          changed = true
        }
      })
    }
    if (a.trip) {
      ;(a.trip.tasks || []).forEach(function (t) {
        if (t.ownerId === 'me') {
          t.ownerId = openid
          changed = true
        }
      })
      ;(a.trip.stays || []).forEach(function (s) {
        if (s.ownerId === 'me') {
          s.ownerId = openid
          changed = true
        }
      })
      ;(a.trip.expenses || []).forEach(function (e) {
        if (e.payerId === 'me') {
          e.payerId = openid
          changed = true
        }
      })
    }
  })
  if (changed) save(d)
}

function afterLogin(openid) {
  if (!openid) return
  setCloudStatus({ openid: openid, loggedIn: true })
  migrateMeToOpenid(openid)
  pullUsers()
  pullActivities(function () {
    syncLocalToCloud()
  })
}

// 需要登录身份的操作统一走这里：已登录直接放行，未登录弹窗引导
function requireLogin(callback) {
  const profile = getProfile()
  if (profile.openid) {
    if (callback) callback(true)
    return
  }
  wx.showModal({
    title: '先登录一下',
    content: '登录后朋友们才能认出你，报名、留言和活动数据也会自动同步',
    confirmText: '去登录',
    cancelText: '先逛逛',
    success(res) {
      if (res.confirm) {
        wx.navigateTo({ url: '/pages/login/login' })
      }
      if (callback) callback(false)
    }
  })
}

// 记录当前用户已授权接收订阅消息，并同步到云端 users 集合
function markSubscribed(openid) {
  updateProfile({ subscribed: true, subscribedAt: Date.now() })
  if (!openid || !wx.cloud || !wx.cloud.callFunction) return
  wx.cloud.callFunction({
    name: 'login',
    data: { action: 'markSubscribed' }
  })
    .catch(function (e) {
      console.error('[notify] 标记订阅失败', e)
    })
}

function getMyCircles() {
  return getData().circles || []
}

// 从云端拉取我加入过的圈子，合并进本地（多设备登录也能看到自己的圈子）
function pullMyCircles(callback) {
  const done = function (ok, circles) {
    if (callback) callback(ok, circles || getData().circles || [])
  }
  if (!wx.cloud || !wx.cloud.callFunction) {
    done(false)
    return
  }
  const profile = getProfile()
  if (!profile.openid) {
    done(false)
    return
  }
  wx.cloud.callFunction({ name: 'login', data: { action: 'getMyCircles' } })
    .then(function (res) {
      const r = res.result || {}
      const list = r.circles || []
      const d = getData()
      let changed = false
      const cloudIds = {}
      list.forEach(function (c) {
        if (!c || !c._id) return
        cloudIds[c._id] = true
        const local = d.circles.find(function (x) { return x.id === c._id })
        if (local) {
          if (c.name && local.name !== c.name) { local.name = c.name; changed = true }
          if (c.code && local.code !== c.code) { local.code = c.code; changed = true }
          if (c.creatorOpenid && local.creatorOpenid !== c.creatorOpenid) { local.creatorOpenid = c.creatorOpenid; changed = true }
        } else {
          d.circles.push({ id: c._id, name: c.name || '我的圈子', code: c.code || '' })
          changed = true
        }
      })
      // 云端已不存在的圈子（被解散/被移出）同步从本地移除
      const before = d.circles.length
      d.circles = (d.circles || []).filter(function (c) { return cloudIds[c.id] })
      if (d.circles.length !== before) changed = true
      if (d.currentCircleId && !cloudIds[d.currentCircleId]) {
        d.currentCircleId = ''
        setCloudStatus({ needsCircle: false })
        changed = true
      }
      if (changed) save(d)
      done(true, d.circles)
    })
    .catch(function (e) {
      console.error('[circle] 拉取我的圈子失败', e)
      done(false)
    })
}

function getCurrentCircle() {
  const d = getData()
  return (d.circles || []).find(function (c) { return c.id === d.currentCircleId }) || null
}

function setCurrentCircle(id) {
  const d = getData()
  d.currentCircleId = id || ''
  save(d)
  setCloudStatus({ needsCircle: false })
  const profile = getProfile()
  if (profile.openid) {
    afterLogin(profile.openid)
  }
}

function addCircleLocal(circle) {
  if (!circle || !circle._id) return ''
  const d = getData()
  const circles = d.circles || []
  if (!circles.find(function (c) { return c.id === circle._id })) {
    circles.push({
      id: circle._id,
      name: circle.name || '我的圈子',
      code: circle.code || '',
      creatorOpenid: circle.creatorOpenid || ''
    })
  }
  d.circles = circles
  save(d)
  return circle._id
}

// 退出/解散后的本地清理：移除圈子与圈内活动，若退的是当前圈子则清空选择
function removeCircleLocal(circleId) {
  if (!circleId) return
  const d = getData()
  d.circles = (d.circles || []).filter(function (c) { return c.id !== circleId })
  d.activities = (d.activities || []).filter(function (a) { return a.circleId !== circleId })
  if (d.currentCircleId === circleId) {
    d.currentCircleId = ''
    setCloudStatus({ needsCircle: false })
  }
  save(d)
}

function leaveCircle(circleId, callback) {
  const done = function (ok, error) {
    if (callback) callback(ok, error)
  }
  if (!wx.cloud || !wx.cloud.callFunction) {
    done(false, '需要联网才能退出圈子')
    return
  }
  wx.cloud.callFunction({ name: 'login', data: { action: 'leaveCircle', circleId: circleId } })
    .then(function (res) {
      const r = res.result || {}
      if (r.ok) {
        removeCircleLocal(circleId)
        done(true)
      } else {
        done(false, r.error || '退出失败')
      }
    })
    .catch(function (e) {
      console.error('[circle] 退出圈子失败', e)
      done(false, ((e && (e.errMsg || e.message)) || '网络异常'))
    })
}

function dissolveCircle(circleId, callback) {
  const done = function (ok, error) {
    if (callback) callback(ok, error)
  }
  if (!wx.cloud || !wx.cloud.callFunction) {
    done(false, '需要联网才能解散圈子')
    return
  }
  wx.cloud.callFunction({ name: 'login', data: { action: 'dissolveCircle', circleId: circleId } })
    .then(function (res) {
      const r = res.result || {}
      if (r.ok) {
        removeCircleLocal(circleId)
        done(true)
      } else {
        done(false, r.error || '解散失败')
      }
    })
    .catch(function (e) {
      console.error('[circle] 解散圈子失败', e)
      done(false, ((e && (e.errMsg || e.message)) || '网络异常'))
    })
}

function migrateActivitiesToCircle(circleId) {
  const d = getData()
  let changed = false
  ;(d.activities || []).forEach(function (a) {
    // 演示数据（a_seed_*）不迁入任何圈子，保护隐私
    if (!a.circleId && a.id.indexOf('a_seed_') !== 0) {
      a.circleId = circleId
      changed = true
      cloudPushActivity(a)
    }
  })
  if (changed) save(d)
}

function joinCircle(code, callback) {
  const done = function (ok, circle, error) {
    if (callback) callback(ok, circle, error)
  }
  if (!wx.cloud || !wx.cloud.callFunction) {
    done(false, null, '需要联网才能加入圈子')
    return
  }
  try {
    wx.cloud.callFunction({ name: 'login', data: { action: 'verifyCircle', code: code } })
      .then(function (res) {
        const r = res.result || {}
        if (!r.ok || !r.circle) {
          done(false, null, r.error || '云端未返回圈子信息，请确认 login 云函数已重新部署')
          return
        }
      const circle = r.circle
      const id = addCircleLocal(circle)
      migrateActivitiesToCircle(id)
      updateProfile({ currentCircleId: id })
      setCloudStatus({ needsCircle: false })
      const profile = getProfile()
        if (profile.openid) {
          afterLogin(profile.openid)
        }
        done(true, circle)
      })
      .catch(function (e) {
        console.error('[circle] 加入圈子失败', e)
        done(false, null, ((e && (e.errMsg || e.message)) || '网络异常'))
      })
  } catch (e) {
    console.error('[circle] 加入圈子异常', e)
    done(false, null, '云开发未初始化，请检查小程序设置')
  }
}

function createCircle(name, callback) {
  const done = function (ok, circle, error) {
    if (callback) callback(ok, circle, error)
  }
  if (!wx.cloud || !wx.cloud.callFunction) {
    done(false, null, '需要联网才能创建圈子')
    return
  }
  try {
    wx.cloud.callFunction({ name: 'login', data: { action: 'createCircle', name: name } })
      .then(function (res) {
        const r = res.result || {}
        if (!r.ok || !r.circle) {
          done(false, null, r.error || '云端未返回圈子信息，请确认 login 云函数已重新部署')
          return
        }
      const circle = r.circle
      const id = addCircleLocal(circle)
      migrateActivitiesToCircle(id)
      updateProfile({ currentCircleId: id })
      setCloudStatus({ needsCircle: false })
      const profile = getProfile()
        if (profile.openid) {
          afterLogin(profile.openid)
        }
        done(true, circle)
      })
      .catch(function (e) {
        console.error('[circle] 创建圈子失败', e)
        done(false, null, ((e && (e.errMsg || e.message)) || '网络异常'))
      })
  } catch (e) {
    console.error('[circle] 创建圈子异常', e)
    done(false, null, '云开发未初始化，请检查小程序设置')
  }
}

// ---- 云端状态跟踪（用于诊断） ----
var cloudStatus = {
  env: '',
  openid: '',
  loggedIn: false,
  needsCircle: false,
  lastOk: false,
  lastError: '',
  lastSyncAt: 0
}

function setCloudStatus(patch) {
  cloudStatus = Object.assign({}, cloudStatus, patch)
}

function getCloudStatus() {
  return Object.assign({}, cloudStatus)
}

function ensureCloudUser(openid) {
  const profile = getProfile()
  if (profile.openid === openid && profile.wechatAuthed) {
    return Promise.resolve()
  }
  updateProfile({ openid: openid, wechatAuthed: true, loginAt: Date.now() })
  return wx.cloud.callFunction({
    name: 'login',
    data: {
      action: 'save',
      name: profile.name || '微信用户',
      avatar: profile.avatar || '',
      location: profile.location || '',
      lat: profile.lat,
      lng: profile.lng
    }
  }).catch(function (e) {
    console.error('[cloud] 自动保存用户资料失败', e)
  })
}

// 把最新昵称/头像/位置同步到云端（登录后修改资料也能让朋友看到）
function syncProfileToCloud() {
  const profile = getProfile()
  if (!profile.openid || !wx.cloud || !wx.cloud.callFunction) return
  wx.cloud.callFunction({
    name: 'login',
    data: {
      action: 'save',
      name: profile.name || '',
      avatar: profile.avatar || '',
      location: profile.location || '',
      lat: profile.lat,
      lng: profile.lng
    }
  }).catch(function (e) {
    console.error('[sync] 资料同步失败', e)
  })
}

function checkCloud(callback) {
  const done = function (result) {
    if (callback) callback(result)
  }
  const status = {
    env: (typeof getApp === 'function' && getApp().cloudEnv) || '',
    openid: '',
    users: false,
    activities: false,
    error: ''
  }
  if (!wx.cloud || !wx.cloud.callFunction) {
    status.error = '当前基础库不支持云开发，请检查小程序版本'
    setCloudStatus({ lastOk: false, lastError: status.error, lastSyncAt: Date.now() })
    done(status)
    return
  }
  wx.cloud.callFunction({ name: 'login', data: { action: 'get' } })
    .then(function (res) {
      const r = res.result || {}
      if (r.ok && r.openid) {
        status.openid = r.openid
        status.users = true
        return ensureCloudUser(r.openid)
      } else {
        status.error = (r && r.error) || '登录接口返回异常'
        return Promise.resolve()
      }
    })
    .then(function () {
      return wx.cloud.callFunction({ name: 'activity', data: { action: 'list', circleId: (getProfile().currentCircleId || '') } })
    })
    .then(function (res) {
      const r = res.result || {}
      if (r.code === 'NEED_CIRCLE') {
        status.error = '需要先加入圈子'
        setCloudStatus({ needsCircle: true })
      } else if (r.ok) {
        status.activities = true
      } else {
        status.error = (r && r.error) || '活动接口返回异常'
      }
      if (status.openid) {
        afterLogin(status.openid)
      }
      setCloudStatus({
        env: status.env,
        openid: status.openid,
        loggedIn: !!status.openid,
        lastOk: !status.error,
        lastError: status.error,
        lastSyncAt: Date.now()
      })
      done(status)
    })
    .catch(function (e) {
      status.error = (e && (e.errMsg || e.message)) || '未知错误'
      setCloudStatus({
        env: status.env,
        lastOk: false,
        lastError: status.error,
        lastSyncAt: Date.now()
      })
      done(status)
    })
}

module.exports = {
  currentUid: currentUid,
  getCachedUser: getCachedUser,
  isOnboardDone: isOnboardDone,
  markOnboardDone: markOnboardDone,
  pullActivities: pullActivities,
  pullUsers: pullUsers,
  syncLocalToCloud: syncLocalToCloud,
  migrateMeToOpenid: migrateMeToOpenid,
  afterLogin: afterLogin,
  requireLogin: requireLogin,
  markSubscribed: markSubscribed,
  getMyCircles: getMyCircles,
  pullMyCircles: pullMyCircles,
  getCurrentCircle: getCurrentCircle,
  setCurrentCircle: setCurrentCircle,
  joinCircle: joinCircle,
  createCircle: createCircle,
  leaveCircle: leaveCircle,
  dissolveCircle: dissolveCircle,
  syncProfileToCloud: syncProfileToCloud,
  getCloudStatus: getCloudStatus,
  checkCloud: checkCloud,
  isPaddyHome: isPaddyHome,
  addPrivateMenuToDinner: addPrivateMenuToDinner,
  addPrivateDish: addPrivateDish,
  TYPE_META: TYPE_META,
  SIGNUP_META: SIGNUP_META,
  ensureSeed: ensureSeed,
  getProfile: getProfile,
  updateProfile: updateProfile,
  getFriends: getFriends,
  getFriend: getFriend,
  addFriend: addFriend,
  updateFriend: updateFriend,
  removeFriend: removeFriend,
  getActivities: getActivities,
  getActivity: getActivity,
  getActivityByCloudId: getActivityByCloudId,
  getUpcoming: getUpcoming,
  getEnded: getEnded,
  createActivity: createActivity,
  removeActivity: removeActivity,
  markEnded: markEnded,
  isCreator: isCreator,
  countMyStats: countMyStats,
  duplicateActivity: duplicateActivity,
  updateActivity: updateActivity,
  addPhoto: addPhoto,
  togglePhotoVote: togglePhotoVote,
  signup: signup,
  addComment: addComment,
  mySignup: mySignup,
  countConfirmed: countConfirmed,
  countMaybe: countMaybe,
  myStatusText: myStatusText,
  getMySignups: getMySignups,
  addTimeSlot: addTimeSlot,
  removeTimeSlot: removeTimeSlot,
  toggleTimeVote: toggleTimeVote,
  addDish: addDish,
  removeDish: removeDish,
  toggleDishVote: toggleDishVote,
  addBringItem: addBringItem,
  removeBringItem: removeBringItem,
  addCar: addCar,
  removeCar: removeCar,
  toggleRider: toggleRider,
  addGear: addGear,
  removeGear: removeGear,
  toggleGearOwner: toggleGearOwner,
  addVenue: addVenue,
  removeVenue: removeVenue,
  toggleVenueVote: toggleVenueVote,
  setFinalVenue: setFinalVenue,
  addTripDay: addTripDay,
  addTripItem: addTripItem,
  removeTripItem: removeTripItem,
  addTask: addTask,
  removeTask: removeTask,
  toggleTaskOwner: toggleTaskOwner,
  addStay: addStay,
  removeStay: removeStay,
  addExpense: addExpense,
  removeExpense: removeExpense,
  aiCall: aiCall,
  resetDemo: resetDemo
}
