const store = require('../../utils/store')
const helpers = require('../../utils/helpers')

const EMOJI_PRESETS = [
  { emoji: '🫶', color: '#FF8FA3' },
  { emoji: '🐧', color: '#7BD3EA' },
  { emoji: '🦌', color: '#B9A7F0' },
  { emoji: '🦅', color: '#F5C76B' },
  { emoji: '🐱', color: '#F0A8A0' },
  { emoji: '🐰', color: '#A5C9F0' },
  { emoji: '🍵', color: '#8FBF9F' },
  { emoji: '🌿', color: '#D6B58F' },
  { emoji: '🐻', color: '#C9A27E' },
  { emoji: '🍓', color: '#F28B9C' },
  { emoji: '🐳', color: '#7FB6E8' },
  { emoji: '🌻', color: '#F2C14E' }
]

Page({
  data: {
    friends: [],
    showAdd: false,
    newName: '',
    newLocation: '',
    newLat: null,
    newLng: null,
    newAvatar: '',
    presets: EMOJI_PRESETS,
    selectedEmoji: EMOJI_PRESETS[0].emoji,
    selectedColor: EMOJI_PRESETS[0].color
  },

  onShow() {
    this.refresh()
  },

  refresh() {
    this.setData({
      friends: store.getFriends()
    })
  },

  toggleAdd() {
    this.setData({
      showAdd: !this.data.showAdd,
      newName: '',
      newLocation: '',
      newLat: null,
      newLng: null,
      newAvatar: '',
      selectedEmoji: EMOJI_PRESETS[0].emoji,
      selectedColor: EMOJI_PRESETS[0].color
    })
  },

  onNewName(e) {
    this.setData({ newName: e.detail.value })
  },

  onNewLocation(e) {
    this.setData({ newLocation: e.detail.value })
  },

  onFriendAvatar(e) {
    const self = this
    helpers.persistAvatar(e.detail.avatarUrl, function (path) {
      self.setData({ newAvatar: path })
    })
  },

  pickLocation() {
    const self = this
    helpers.chooseMapLocation(function (loc) {
      self.setData({
        newLocation: loc.name || loc.address,
        newLat: loc.lat,
        newLng: loc.lng
      })
    })
  },

  selectEmoji(e) {
    const idx = e.currentTarget.dataset.index
    this.setData({
      selectedEmoji: this.data.presets[idx].emoji,
      selectedColor: this.data.presets[idx].color
    })
  },

  saveFriend() {
    const name = this.data.newName.trim()
    if (!name) {
      wx.showToast({ title: '填个名字吧', icon: 'none' })
      return
    }
    store.addFriend({
      name: name,
      location: this.data.newLocation.trim(),
      lat: this.data.newLat,
      lng: this.data.newLng,
      avatar: this.data.newAvatar,
      emoji: this.data.selectedEmoji,
      color: this.data.selectedColor
    })
    this.setData({
      showAdd: false,
      newName: '',
      newLocation: '',
      newLat: null,
      newLng: null,
      newAvatar: ''
    })
    this.refresh()
    wx.showToast({ title: '已添加 🎉', icon: 'success' })
  },

  manageFriend(e) {
    const id = e.currentTarget.dataset.id
    const friend = store.getFriend(id)
    if (!friend) return
    const self = this
    wx.showActionSheet({
      itemList: ['修改所在位置', '删除好友'],
      success(res) {
        if (res.tapIndex === 0) {
          helpers.chooseMapLocation(function (loc) {
            store.updateFriend(id, {
              location: loc.name || loc.address,
              lat: loc.lat,
              lng: loc.lng
            })
            self.refresh()
          })
        } else if (res.tapIndex === 1) {
          wx.showModal({
            title: '删除好友',
            content: '确定删除「' + friend.name + '」吗？',
            confirmColor: '#FF4D4F',
            success(modalRes) {
              if (modalRes.confirm) {
                store.removeFriend(id)
                self.refresh()
              }
            }
          })
        }
      }
    })
  }
})
