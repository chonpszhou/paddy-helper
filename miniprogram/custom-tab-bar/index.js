const icons = require('../utils/icons')

Component({
  data: {
    selected: 0,
    spin: false,
    list: [
      {
        pagePath: '/pages/index/index',
        text: '首页',
        iconPath: icons.icon('home', '#9AA3AF'),
        selectedIconPath: icons.icon('home', '#07C160')
      },
      {
        pagePath: '/pages/activity/create/create',
        text: '发起',
        iconPath: icons.icon('plus', '#9AA3AF'),
        selectedIconPath: icons.icon('plus', '#07C160')
      },
      {
        pagePath: '/pages/profile/profile',
        text: '我的',
        iconPath: icons.icon('user', '#9AA3AF'),
        selectedIconPath: icons.icon('user', '#07C160')
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
