const store = require('../../utils/store')
const helpers = require('../../utils/helpers')
const config = require('../../utils/config')
const icons = require('../../utils/icons')

Page({
  data: {
    avatar: '',
    nickname: '',
    camIcon: icons.icon('camera', '#8B95A7'),
    agreed: false
  },

  onLoad() {
    const profile = store.getProfile()
    this.setData({
      avatar: profile.avatar || ''
    })
  },

  onChooseAvatar(e) {
    const self = this
    helpers.persistAvatar(e.detail.avatarUrl, function (path) {
      self.setData({ avatar: path })
    })
  },

  onNickname(e) {
    this.setData({ nickname: e.detail.value })
  },

  toggleAgree() {
    this.setData({ agreed: !this.data.agreed })
  },

  goAgreement() {
    wx.navigateTo({
      url: '/pages/agreement/agreement'
    })
  },

  confirm() {
    if (!this.data.agreed) {
      wx.showToast({ title: '请先阅读并勾选同意协议', icon: 'none' })
      return
    }
    const nickname = this.data.nickname.trim() || '微信用户'
    const self = this
    const subPromise = (config.SUBSCRIBE_TEMPLATE_ID && wx.requestSubscribeMessage)
      ? wx.requestSubscribeMessage({ tmplIds: [config.SUBSCRIBE_TEMPLATE_ID] })
        .then(function (res) { return res[config.SUBSCRIBE_TEMPLATE_ID] === 'accept' })
        .catch(function () { return false })
      : Promise.resolve(false)

    const finish = function (openid, avatarFileID) {
      subPromise.then(function (subAccepted) {
        store.updateProfile({
          name: nickname,
          avatar: avatarFileID || self.data.avatar,
          wechatAuthed: true,
          openid: openid || '',
          subscribed: subAccepted,
          loginAt: Date.now()
        })
        if (subAccepted && openid) {
          store.markSubscribed(openid)
        }
        wx.showToast({ title: '登录成功 🎉', icon: 'success' })
        setTimeout(function () {
          const ret = wx.getStorageSync('login_return')
          if (ret) {
            wx.removeStorageSync('login_return')
            wx.reLaunch({ url: ret })
            return
          }
          const profile = store.getProfile()
          if (!profile.currentCircleId) {
            wx.reLaunch({ url: '/pages/circle/circle' })
          } else {
            wx.switchTab({ url: '/pages/index/index' })
          }
        }, 600)
      })
    }

    if (!wx.cloud) {
      finish('', '')
      return
    }

    wx.cloud.callFunction({ name: 'login', data: { action: 'get' } })
      .then(function (res) {
        const r = res.result || {}
        if (!r.ok || !r.openid) {
          wx.showModal({
            title: '云端登录失败',
            content: (r.error || '云端返回异常，请稍后再试'),
            showCancel: false
          })
          return
        }
        const openid = r.openid
        const avatarPath = self.data.avatar
        const saveUser = function (avatarFileID) {
          const profile = store.getProfile()
          wx.cloud.callFunction({
            name: 'login',
            data: {
              action: 'save',
              name: nickname,
              avatar: avatarFileID || '',
              location: profile.location || ''
            }
          }).then(function (res) {
            const r = res.result || {}
            if (r.ok === false) {
              wx.showModal({
                title: '昵称未通过',
                content: r.error || '昵称包含不合适的内容，请修改后重试',
                showCancel: false
              })
              return
            }
            store.afterLogin(openid)
            finish(openid, avatarFileID)
          })
            .catch(function (e) {
              console.error('[login] 保存用户资料失败', e)
              store.afterLogin(openid)
              finish(openid, avatarFileID)
            })
        }
        if (avatarPath && avatarPath.indexOf('wxfile://') === 0) {
          wx.cloud.uploadFile({
            cloudPath: 'avatars/' + openid + '-' + Date.now() + '.png',
            filePath: avatarPath
          }).then(function (up) { saveUser(up.fileID) })
            .catch(function () { saveUser('') })
        } else {
          saveUser('')
        }
      })
      .catch(function (e) {
        console.error('[login] 云端登录失败', e)
        wx.showModal({
          title: '云端连接失败',
          content: '错误信息：' + ((e && (e.errMsg || e.message)) || '未知错误') + '\n\n请检查：\n1) 云函数 login 已上传部署\n2) 数据库已创建 users、activities 集合\n3) 云环境选择正确',
          showCancel: false
        })
      })
  }
  ,

  goPrivacy() {
    wx.navigateTo({
      url: '/pages/privacy/privacy'
    })
  }
})
