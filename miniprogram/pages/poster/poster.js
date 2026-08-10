const store = require('../../utils/store')
const helpers = require('../../utils/helpers')

const W = 750
const PAD = 44

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function wrapLines(ctx, text, maxWidth, maxLines) {
  const chars = String(text || '').split('')
  const lines = []
  let line = ''
  for (let i = 0; i < chars.length; i++) {
    const test = line + chars[i]
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = chars[i]
      if (lines.length >= maxLines) break
    } else {
      line = test
    }
  }
  if (line && lines.length < maxLines) lines.push(line)
  if (chars.length && lines.length >= maxLines) {
    lines[maxLines - 1] = lines[maxLines - 1].replace(/[，。、\s]+$/, '').slice(0, 20) + '…'
  }
  return lines
}

Page({
  data: {
    id: '',
    posterPath: '',
    generating: true,
    error: '',
    saving: false,
    shareTitle: ''
  },

  onLoad(options) {
    this.setData({ id: options.id || '' })
  },

  onReady() {
    this.draw()
  },

  draw() {
    const activity = store.getActivity(this.data.id)
    if (!activity) {
      this.setData({ generating: false, error: '活动不存在，无法生成海报' })
      return
    }
    const self = this
    const profile = store.getProfile()
    const uid = store.currentUid()
    const meta = store.TYPE_META[activity.type] || { name: '活动', color: '#6B7280', icon: '📌' }
    const accent = meta.color || '#07C160'

    const participants = (activity.signups || [])
      .filter(function (s) { return s.status === 'yes' || s.status === 'maybe' })
      .map(function (s) {
        if (s.friendId === uid) return { name: profile.name, color: '#07C160' }
        const f = store.getFriend(s.friendId) || store.getCachedUser(s.friendId)
        return f ? { name: f.name, color: f.color || '#D9CFC4' } : null
      })
      .filter(function (p) { return p })

    const circle = store.getMyCircles().find(function (c) { return c.id === activity.circleId })
    const title = activity.title || '周末活动'
    const timeText = helpers.formatDateTime(activity.startTime)
    const location = activity.location || '地点待定'
    const host = activity.creatorName || profile.name
    const description = activity.description || ''
    this.setData({
      shareTitle: '【' + (activity.type === 'dinner' ? '聚餐' : meta.name) + '】' + title
    })

    const query = wx.createSelectorQuery()
    query.select('#posterCanvas').fields({ node: true, size: true }).exec(function (res) {
      if (!res || !res[0] || !res[0].node) {
        self.setData({ generating: false, error: '画布初始化失败，请重试' })
        return
      }
      const canvas = res[0].node
      const dpr = (wx.getWindowInfo ? wx.getWindowInfo().pixelRatio : 2) || 2
      const ctx = canvas.getContext('2d')

      // 布局计算
      const innerW = W - PAD * 2
      ctx.font = 'bold 54px sans-serif'
      const titleLines = wrapLines(ctx, title, innerW, 2)
      ctx.font = '28px sans-serif'
      const descLines = wrapLines(ctx, description, innerW, 4)
      const membersH = participants.length ? 130 : 0
      const yTitle = 250
      const yDesc = yTitle + titleLines.length * 70 + 360 + membersH
      const H = yDesc + descLines.length * 46 + 170

      canvas.width = W * dpr
      canvas.height = H * dpr
      ctx.scale(dpr, dpr)

      const finish = function () {
        wx.canvasToTempFilePath({
          canvas: canvas,
          success(res) {
            self.setData({ posterPath: res.tempFilePath, generating: false })
          },
          fail() {
            self.setData({ generating: false, error: '海报生成失败，请重试' })
          }
        })
      }

      drawAurora(ctx, H)
      drawContent(ctx, H, titleLines, descLines, participants, yTitle, yDesc, meta, accent, circle, timeText, location, host, false)
      finish()
    })
  },

  savePoster() {
    const self = this
    if (!this.data.posterPath) return
    this.setData({ saving: true })
    wx.saveImageToPhotosAlbum({
      filePath: this.data.posterPath,
      success() {
        self.setData({ saving: false })
        wx.showToast({ title: '已保存到相册 📸', icon: 'success' })
      },
      fail(err) {
        self.setData({ saving: false })
        const msg = (err && err.errMsg) || ''
        if (msg.indexOf('auth') >= 0 || msg.indexOf('denied') >= 0) {
          wx.showModal({
            title: '需要相册权限',
            content: '请在设置里允许「保存图片到相册」，才能保存海报',
            confirmText: '去设置',
            success(res) {
              if (res.confirm) wx.openSetting()
            }
          })
        } else {
          wx.showToast({ title: '保存失败，请重试', icon: 'none' })
        }
      }
    })
  },

  onShareAppMessage() {
    const activity = store.getActivity(this.data.id)
    const id = activity ? (activity.cloudId ? 'cid=' + activity.cloudId : 'id=' + activity.id) : 'id=' + this.data.id
    return {
      title: this.data.shareTitle || '周末一起约',
      path: '/pages/activity/detail/detail?' + id
    }
  }
})

function drawAurora(ctx, H) {
  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, '#F4FCF7')
  bg.addColorStop(0.5, '#EEF6FF')
  bg.addColorStop(1, '#F6F1FF')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  drawBlob(ctx, 80, 80, 260, 'rgba(126, 240, 192, 0.30)')
  drawBlob(ctx, W - 160, 240, 300, 'rgba(143, 208, 255, 0.28)')
  drawBlob(ctx, 120, H - 220, 320, 'rgba(200, 168, 255, 0.24)')
}

function drawContent(ctx, H, titleLines, descLines, participants, yTitle, yDesc, meta, accent, circle, timeText, location, host, aiMode) {
  ctx.save()
  ctx.shadowColor = 'rgba(16, 24, 40, 0.10)'
  ctx.shadowBlur = 30
  ctx.shadowOffsetY = 12
  roundRect(ctx, 30, 34, W - 60, H - 68, 44)
  ctx.fillStyle = aiMode ? 'rgba(255, 255, 255, 0.90)' : 'rgba(255, 255, 255, 0.85)'
  ctx.fill()
  ctx.restore()

  ctx.fillStyle = '#9AA3AF'
  ctx.font = '26px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('WEEKEND · 周末约', PAD, 110)

  if (circle && circle.name) {
    const cw = ctx.measureText(circle.name).width + 44
    roundRect(ctx, PAD, 138, cw, 52, 26)
    ctx.fillStyle = 'rgba(139, 92, 246, 0.12)'
    ctx.fill()
    ctx.fillStyle = '#7C3AED'
    ctx.font = '24px sans-serif'
    ctx.fillText(circle.name, PAD + 22, 172)
  }

  const badgeW = ctx.measureText(meta.name).width + 44
  roundRect(ctx, W - PAD - badgeW, 138, badgeW, 52, 26)
  ctx.fillStyle = hexA(accent, 0.13)
  ctx.fill()
  ctx.fillStyle = accent
  ctx.font = '24px sans-serif'
  ctx.fillText(meta.name, W - PAD - badgeW + 22, 172)

  ctx.fillStyle = '#0E1116'
  ctx.font = 'bold 54px sans-serif'
  titleLines.forEach(function (line, i) {
    ctx.fillText(line, PAD, yTitle + i * 70)
  })

  ctx.font = '32px sans-serif'
  ctx.fillStyle = '#3D4450'
  let iy = yTitle + titleLines.length * 70 + 56
  ctx.fillText('🕐 ' + timeText, PAD, iy)
  iy += 62
  ctx.fillText('📍 ' + location, PAD, iy)
  iy += 62
  ctx.fillText('🙋 发起人 ' + host, PAD, iy)
  iy += 62

  ctx.strokeStyle = 'rgba(16, 24, 40, 0.08)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(PAD, iy + 8)
  ctx.lineTo(W - PAD, iy + 8)
  ctx.stroke()

  if (participants.length) {
    ctx.fillStyle = '#0E1116'
    ctx.font = 'bold 30px sans-serif'
    ctx.fillText('一起参加', PAD, iy + 62)
    const show = participants.slice(0, 6)
    const d = 72
    const gap = 46
    show.forEach(function (p, i) {
      const cx = PAD + i * (d + gap) + d / 2
      const cy = iy + 140
      ctx.beginPath()
      ctx.arc(cx, cy, d / 2, 0, Math.PI * 2)
      ctx.fillStyle = p.color || '#D9CFC4'
      ctx.fill()
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 28px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(String(p.name).charAt(0).toUpperCase(), cx, cy + 10)
      ctx.textAlign = 'left'
    })
    if (participants.length > show.length) {
      const cx = PAD + show.length * (d + gap) + d / 2
      const cy = iy + 140
      ctx.beginPath()
      ctx.arc(cx, cy, d / 2, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(16, 24, 40, 0.06)'
      ctx.fill()
      ctx.fillStyle = '#6F675F'
      ctx.font = 'bold 26px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('+' + (participants.length - show.length), cx, cy + 10)
      ctx.textAlign = 'left'
    }
  }

  ctx.fillStyle = '#6F675F'
  ctx.font = '28px sans-serif'
  descLines.forEach(function (line, i) {
    ctx.fillText(line, PAD, yDesc + i * 46)
  })

  ctx.fillStyle = '#B0A79E'
  ctx.font = '24px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('Paddy小助手 · 把周末过得热气腾腾', W / 2, H - 62)
  ctx.textAlign = 'left'
}

function hexA(hex, alpha) {
  const c = String(hex || '#07C160').replace('#', '')
  const r = parseInt(c.substring(0, 2), 16)
  const g = parseInt(c.substring(2, 4), 16)
  const b = parseInt(c.substring(4, 6), 16)
  return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')'
}

function drawBlob(ctx, x, y, r, color) {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
}
