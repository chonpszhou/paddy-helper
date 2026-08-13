const icons = require('../utils/icons')

Component({
  data: {
    selected: 0,
    spin: false,
    list: [
      {
        pagePath: '/pages/index/index',
        text: '首页',
        iconPath: icons.icon('home', '#8B95A7'),
        selectedIconPath: icons.icon('home', '#00E5A0')
      },
      {
        pagePath: '/pages/activity/create/create',
        text: '发起',
        iconPath: icons.icon('plus', '#8B95A7'),
        selectedIconPath: icons.icon('plus', '#00E5A0')
      },
      {
        pagePath: '/pages/profile/profile',
        text: '我的',
        iconPath: icons.icon('user', '#8B95A7'),
        selectedIconPath: icons.icon('user', '#00E5A0')
      }
    ]
  },

  methods: {
    switchTab(e) {
      const path = e.currentTarget.dataset.path
      const index = e.currentTarget.dataset.index
      if (index === 1) {
        this.setData({ spin: true })
        const self = this
        setTimeout(function () {
          wx.switchTab({ url: path })
          self.setData({ selected: index, spin: false })
        }, 260)
      } else {
        wx.switchTab({ url: path })
        this.setData({ selected: index })
      }
    }
  }
})
