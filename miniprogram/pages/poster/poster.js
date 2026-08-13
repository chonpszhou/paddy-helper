const store = require('../../utils/store')
const helpers = require('../../utils/helpers')

const W = 750
const PAD = 48
const HERO_H = 330
const INNER_W = W - PAD * 2

const THEMES = {
  dinner: { name: '聚餐', icon: '🍲', accent: '#FF7A45', g0: '#FFF1E6', g1: '#FFE3D1' },
  outdoor: { name: '户外', icon: '⛺', accent: '#10B981', g0: '#E7FBF2', g1: '#D9F6EA' },
  group: { name: '团体活动', icon: '🎲', accent: '#8B5CF6', g0: '#F0EBFF', g1: '#E6DEFF' },
  trip: { name: '旅行', icon: '✈️', accent: '#0EA5E9', g0: '#E6F7FF', g1: '#D8F0FF' }
}
const DEFAULT_THEME = { name: '活动', icon: '📌', accent: '#6B7280', g0: '#F1F3F5', g1: '#E9ECEF' }

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

function drawSparkle(ctx, x, y, size, color) {
  ctx.save()
  ctx.translate(x, y)
  ctx.fillStyle = color
  ctx.beginPath()
  for (let i = 0; i < 8; i++) {
    const rad = i % 2 === 0 ? size : size * 0.32
    const angle = (i / 8) * Math.PI * 2
    const px = Math.cos(angle) * rad
    const py = Math.sin(angle) * rad
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function drawChip(ctx, x, y, text, bg, fg, font, padX) {
  const w = ctx.measureText(text).width + padX * 2
  roundRect(ctx, x, y, w, 46, 23)
  ctx.fillStyle = bg
  ctx.fill()
  ctx.fillStyle = fg
  ctx.font = font
  ctx.textAlign = 'left'
  ctx.fillText(text, x + padX, y + 32)
  return w
}

function drawWave(ctx, baseY, color) {
  ctx.beginPath()
  ctx.moveTo(0, baseY)
  for (let x = 0; x <= W; x += 15) {
    ctx.lineTo(x, baseY + Math.sin(x / 110) * 13)
  }
  ctx.lineTo(W, baseY + 64)
  ctx.lineTo(0, baseY + 64)
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
}

function drawCard(ctx, x, y, w, h, bg) {
  ctx.save()
  ctx.shadowColor = 'rgba(30, 41, 59, 0.08)'
  ctx.shadowBlur = 24
  ctx.shadowOffsetY = 8
  roundRect(ctx, x, y, w, h, 34)
  ctx.fillStyle = bg || 'rgba(255, 255, 255, 0.94)'
  ctx.fill()
  ctx.restore()
  roundRect(ctx, x, y, w, h, 34)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
  ctx.lineWidth = 2
  ctx.stroke()
}

function drawDash(ctx, x1, y1, x2, y2) {
  ctx.save()
  ctx.setLineDash([8, 8])
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.10)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
  ctx.restore()
}

function buildExtras(activity, confirmed) {
  if (activity.type === 'dinner') {
    const dishes = (activity.dinner && activity.dinner.dishes || []).slice()
      .sort(function (a, b) { return (b.voters || []).length - (a.voters || []).length })
      .slice(0, 4)
    if (!dishes.length) return []
    return [{
      title: '人气菜单',
      rows: dishes.map(function (d) {
        return { icon: '🥢', text: d.name + ((d.voters || []).length ? ' · ' + d.voters.length + ' 人想点' : '') }
      })
    }]
  }
  if (activity.type === 'outdoor') {
    const o = activity.outdoor || {}
    const rows = []
    if ((o.cars || []).length) {
      rows.push({ icon: '🚗', text: '拼车 ' + o.cars.length + ' 辆 · 搭车 ' + (o.riders || []).length + ' 人' })
    }
    if ((o.gear || []).length) {
      rows.push({ icon: '🎒', text: '装备 ' + o.gear.length + ' 件已登记' })
    }
    if (!rows.length) return []
    return [{ title: '筹备情况', rows: rows }]
  }
  if (activity.type === 'group') {
    const g = activity.group || {}
    const venues = g.venues || []
    const final = venues.find(function (v) { return v.id === g.finalVenueId })
    const rows = final
      ? [{ icon: '🏟️', text: '已定：' + final.name }]
      : venues.length ? [{ icon: '🏟️', text: '候选场馆 ' + venues.length + ' 家 · 待大家投票' }] : []
    if (!rows.length) return []
    return [{ title: '场地安排', rows: rows }]
  }
  if (activity.type === 'trip') {
    const t = activity.trip || {}
    const total = (t.expenses || []).reduce(function (n, e) { return n + (Number(e.amount) || 0) }, 0)
    if (!total) return []
    const per = confirmed > 0 ? Math.round(total / confirmed) : total
    return [{
      title: '预算情况',
      rows: [{ icon: '💎', text: '总预算 ¥' + total + ' · 人均 ¥' + per + '（' + confirmed + ' 人 AA）' }]
    }]
  }
  return []
}

function drawHero(ctx, theme, accent, circle) {
  const g = ctx.createLinearGradient(0, 0, 0, HERO_H)
  g.addColorStop(0, theme.g0)
  g.addColorStop(1, theme.g1)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, HERO_H + 70)

  drawBlob(ctx, 70, 50, 150, hexA(accent, 0.12))
  drawBlob(ctx, W - 80, 120, 200, 'rgba(255,255,255,0.45)')
  drawBlob(ctx, 190, 260, 100, hexA(accent, 0.10))
  drawSparkle(ctx, 96, 190, 16, 'rgba(255,255,255,0.9)')
  drawSparkle(ctx, W - 120, 60, 12, hexA(accent, 0.35))
  drawSparkle(ctx, W - 70, 220, 14, 'rgba(255,255,255,0.75)')

  ctx.font = '24px sans-serif'
  drawChip(ctx, PAD, 58, 'WEEKEND · 周末约', 'rgba(255,255,255,0.55)', '#5B6472', '24px sans-serif', 20)
  const typeText = theme.name
  const tw = ctx.measureText(typeText).width + 40
  drawChip(ctx, W - PAD - tw, 58, typeText, hexA(accent, 0.22), accent, '24px sans-serif', 20)

  const cx = W / 2
  const cy = 160
  ctx.save()
  ctx.shadowColor = 'rgba(30, 41, 59, 0.14)'
  ctx.shadowBlur = 26
  ctx.shadowOffsetY = 10
  ctx.beginPath()
  ctx.arc(cx, cy, 72, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.fill()
  ctx.restore()
  ctx.beginPath()
  ctx.arc(cx, cy, 72, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(255,255,255,0.95)'
  ctx.lineWidth = 4
  ctx.stroke()
  ctx.font = '64px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(theme.icon, cx, cy + 22)
  ctx.textAlign = 'left'

  if (circle && circle.name) {
    ctx.font = '24px sans-serif'
    ctx.fillStyle = 'rgba(30, 41, 59, 0.55)'
    ctx.textAlign = 'center'
    ctx.fillText('🫧 ' + circle.name, cx, HERO_H - 46)
    ctx.textAlign = 'left'
  }

  drawWave(ctx, HERO_H - 10, '#FFFFFF')
}

function drawTitle(ctx, block, titleLines, accent) {
  roundRect(ctx, PAD, block.y - 10, 12, titleLines.length * 68 + 18, 6)
  ctx.fillStyle = accent
  ctx.fill()
  ctx.fillStyle = '#171A21'
  ctx.font = 'bold 46px sans-serif'
  titleLines.forEach(function (line, i) {
    ctx.fillText(line, PAD + 34, block.y + i * 68 + 52)
  })
}

function drawInfo(ctx, block, infoRows) {
  drawCard(ctx, PAD, block.y, INNER_W, block.h)
  let yy = block.y + 40
  infoRows.forEach(function (r) {
    ctx.font = '28px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(r.icon, PAD + 30, yy + 30)
    ctx.font = '26px sans-serif'
    ctx.fillStyle = '#2E3440'
    r.lines.forEach(function (ln, i) {
      ctx.fillText(ln, PAD + 96, yy + 30 + i * 36)
    })
    yy += r.lines.length * 36 + 16
  })
}

function drawStats(ctx, block, participants, confirmed, maybe) {
  drawCard(ctx, PAD, block.y, INNER_W, block.h)
  ctx.fillStyle = '#0E1116'
  ctx.font = 'bold 30px sans-serif'
  const statText = '✅ ' + confirmed + ' 人参加' + (maybe ? '　🤔 ' + maybe + ' 人待定' : '')
  ctx.fillText(statText, PAD + 30, block.y + 44)

  const show = participants.slice(0, 7)
  const d = 62
  const gap = 18
  const startX = PAD + 30
  const cy = block.y + 108
  show.forEach(function (p, i) {
    const cx = startX + i * (d + gap) + d / 2
    ctx.beginPath()
    ctx.arc(cx, cy, d / 2, 0, Math.PI * 2)
    ctx.fillStyle = p.color || '#D9CFC4'
    ctx.fill()
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 4
    ctx.stroke()
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 28px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(String(p.name).charAt(0), cx, cy + 10)
    ctx.textAlign = 'left'
  })
  if (participants.length > show.length) {
    const cx = startX + show.length * (d + gap) + d / 2
    ctx.beginPath()
    ctx.arc(cx, cy, d / 2, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.06)'
    ctx.fill()
    ctx.fillStyle = '#6F675F'
    ctx.font = 'bold 26px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('+' + (participants.length - show.length), cx, cy + 10)
    ctx.textAlign = 'left'
  }
}

function drawExtras(ctx, block, extrasRows, accent) {
  drawCard(ctx, PAD, block.y, INNER_W, block.h)
  roundRect(ctx, PAD + 30, block.y + 28, 12, 12, 6)
  ctx.fillStyle = accent
  ctx.fill()
  ctx.fillStyle = '#0E1116'
  ctx.font = 'bold 28px sans-serif'
  ctx.fillText(extrasRows[0].title, PAD + 54, block.y + 43)
  let yy = block.y + 92
  extrasRows.forEach(function (r) {
    r.rows.forEach(function (line) {
      ctx.font = '27px sans-serif'
      ctx.fillStyle = '#3D4450'
      ctx.fillText(line.icon + ' ' + line.text, PAD + 34, yy)
      yy += 46
    })
  })
}

function drawDesc(ctx, block, descLines) {
  drawCard(ctx, PAD, block.y, INNER_W, block.h)
  ctx.fillStyle = '#0E1116'
  ctx.font = 'bold 28px sans-serif'
  ctx.fillText('📝 活动说明', PAD + 30, block.y + 42)
  ctx.font = '27px sans-serif'
  ctx.fillStyle = '#4B5563'
  descLines.forEach(function (line, i) {
    ctx.fillText(line, PAD + 30, block.y + 92 + i * 44)
  })
}

function drawFooter(ctx, block, H) {
  drawDash(ctx, PAD + 20, block.y + 26, W - PAD - 20, block.y + 26)
  ctx.fillStyle = '#9AA3AF'
  ctx.font = '26px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('✨ Paddy小助手 · 把周末过得热气腾腾 ✨', W / 2, block.y + 78)
  ctx.textAlign = 'left'
  drawBlob(ctx, 70, H - 46, 10, 'rgba(255,138,91,0.25)')
  drawBlob(ctx, W - 84, H - 40, 8, 'rgba(139,92,246,0.22)')
  drawBlob(ctx, W - 136, H - 68, 6, 'rgba(14,165,233,0.25)')
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
    const theme = THEMES[activity.type] || DEFAULT_THEME
    const accent = theme.accent

    const participants = (activity.signups || [])
      .filter(function (s) { return s.status === 'yes' || s.status === 'maybe' })
      .map(function (s) {
        if (s.friendId === uid) return { name: profile.name || '朋友', color: '#07C160' }
        const f = store.getFriend(s.friendId) || store.getCachedUser(s.friendId)
        return f ? { name: f.name, color: f.color || '#D9CFC4' } : null
      })
      .filter(function (p) { return p })

    const circle = store.getMyCircles().find(function (c) { return c.id === activity.circleId })
    const title = activity.title || '周末活动'
    const timeText = helpers.formatDateTime(activity.startTime)
    const location = activity.location || '地点待定'
    const host = activity.creatorName || profile.name || '朋友'
    const description = activity.description || ''
    const confirmed = store.countConfirmed(activity)
    const maybe = store.countMaybe(activity)
    const extrasRows = buildExtras(activity, confirmed)
    const extrasLineCount = extrasRows.reduce(function (n, b) { return n + b.rows.length }, 0)

    this.setData({
      shareTitle: '【' + theme.name + '】' + title
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

      ctx.font = 'bold 46px sans-serif'
      const titleLines = wrapLines(ctx, title, INNER_W - 70, 3)
      ctx.font = '27px sans-serif'
      const descLines = wrapLines(ctx, description, INNER_W - 60, 6)
      ctx.font = '26px sans-serif'
      const locLines = wrapLines(ctx, location, INNER_W - 150, 2)
      const timeLines = wrapLines(ctx, timeText, INNER_W - 150, 1)
      const hostLines = wrapLines(ctx, '发起人 ' + host, INNER_W - 150, 2)

      const infoRows = [
        { icon: '🕐', text: timeText, lines: timeLines },
        { icon: '📍', text: location, lines: locLines },
        { icon: '🙋', text: '发起人 ' + host, lines: hostLines }
      ]
      const infoH = 46 + infoRows.reduce(function (s, r) { return s + (r.lines.length * 36 + 16) }, 0) + 26
      const statsH = participants.length ? 52 + 112 : 0
      const extrasH = extrasLineCount ? 52 + 34 + extrasLineCount * 46 + 16 : 0
      const descH = descLines.length ? 52 + 36 + descLines.length * 44 + 10 : 0

      const layout = []
      let y = HERO_H - 30
      y += 46
      layout.push({ type: 'title', y: y, h: titleLines.length * 68 })
      y += titleLines.length * 68 + 28
      layout.push({ type: 'info', y: y, h: infoH })
      y += infoH + 28
      if (statsH) {
        layout.push({ type: 'stats', y: y, h: statsH })
        y += statsH + 28
      }
      if (extrasH) {
        layout.push({ type: 'extras', y: y, h: extrasH })
        y += extrasH + 28
      }
      if (descH) {
        layout.push({ type: 'desc', y: y, h: descH })
        y += descH + 28
      }
      layout.push({ type: 'footer', y: y, h: 132 })
      const H = y + 150

      canvas.width = W * dpr
      canvas.height = H * dpr
      ctx.scale(dpr, dpr)

      const bg = ctx.createLinearGradient(0, 0, 0, H)
      bg.addColorStop(0, '#FDFEFF')
      bg.addColorStop(1, '#F6F9FF')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)

      drawHero(ctx, theme, accent, circle)
      layout.forEach(function (block) {
        if (block.type === 'title') drawTitle(ctx, block, titleLines, accent)
        else if (block.type === 'info') drawInfo(ctx, block, infoRows)
        else if (block.type === 'stats') drawStats(ctx, block, participants, confirmed, maybe)
        else if (block.type === 'extras') drawExtras(ctx, block, extrasRows, accent)
        else if (block.type === 'desc') drawDesc(ctx, block, descLines)
        else if (block.type === 'footer') drawFooter(ctx, block, H)
      })

      wx.canvasToTempFilePath({
        canvas: canvas,
        success(res) {
          self.setData({ posterPath: res.tempFilePath, generating: false })
        },
        fail() {
          self.setData({ generating: false, error: '海报生成失败，请重试' })
        }
      })
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
  },

  onShareTimeline() {
    const activity = store.getActivity(this.data.id)
    const id = activity ? (activity.cloudId ? 'cid=' + activity.cloudId : 'id=' + activity.id) : 'id=' + this.data.id
    return {
      title: this.data.shareTitle || '周末一起约',
      query: id,
      imageUrl: this.data.posterPath || ''
    }
  }
})
