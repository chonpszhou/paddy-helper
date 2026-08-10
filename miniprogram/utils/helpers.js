const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

function pad(n) {
  return n < 10 ? '0' + n : '' + n
}

function formatDateTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const yearText = d.getFullYear() !== new Date().getFullYear() ? d.getFullYear() + '年' : ''
  return yearText + (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + WEEKDAYS[d.getDay()] + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes())
}

function formatDate(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const yearText = d.getFullYear() !== new Date().getFullYear() ? d.getFullYear() + '年' : ''
  return yearText + (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + WEEKDAYS[d.getDay()]
}

function formatDateInput(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
}

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return pad(d.getHours()) + ':' + pad(d.getMinutes())
}

function today() {
  const d = new Date()
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
}

function combineDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null
  const parts = dateStr.split('-').map(Number)
  const times = timeStr.split(':').map(Number)
  return new Date(parts[0], parts[1] - 1, parts[2], times[0], times[1]).getTime()
}

function greeting() {
  const h = new Date().getHours()
  if (h < 6) return '夜深了'
  if (h < 11) return '早上好'
  if (h < 13) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
}

// 返回 { kind: 'ended' | 'live' | 'upcoming', days, hours, mins }
function countdownParts(ts) {
  if (!ts) return null
  const diff = ts - Date.now()
  if (diff <= 0) {
    if (diff > -6 * 3600000) return { kind: 'live' }
    return { kind: 'ended' }
  }
  return {
    kind: 'upcoming',
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    mins: Math.floor((diff % 3600000) / 60000)
  }
}

// 简短状态文本：今天 19:00 / 明天 19:00 / 2 天后 / 进行中 / 已结束
function countdownText(ts) {
  const p = countdownParts(ts)
  if (!p) return ''
  if (p.kind === 'ended') return '已结束'
  if (p.kind === 'live') return '进行中'
  const d = new Date(ts)
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const eventDayMs = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const calDays = Math.round((eventDayMs - startOfToday.getTime()) / 86400000)
  const hm = pad(d.getHours()) + ':' + pad(d.getMinutes())
  if (calDays <= 0) return '今天 ' + hm
  if (calDays === 1) return '明天 ' + hm
  if (calDays <= 6) return calDays + ' 天后'
  return (d.getMonth() + 1) + '月' + d.getDate() + '日'
}

// 详情页完整倒计时文案
function countdownDetail(ts) {
  const p = countdownParts(ts)
  if (!p) return ''
  if (p.kind === 'ended') return '活动已结束，期待下次再约 🎉'
  if (p.kind === 'live') return '正在火热进行中 🔥'
  if (p.days > 0) {
    let t = '距离开始还有 ' + p.days + ' 天 ' + p.hours + ' 小时'
    if (p.mins > 0) t += ' ' + p.mins + ' 分'
    return t
  }
  if (p.hours > 0) return '距离开始还有 ' + p.hours + ' 小时 ' + p.mins + ' 分'
  return '距离开始还有 ' + p.mins + ' 分钟'
}

function chooseMapLocation(callback) {
  wx.chooseLocation({
    success(res) {
      const address = res.address || ''
      callback({
        name: res.name || address || '已选地点',
        address: address,
        lat: res.latitude,
        lng: res.longitude
      })
    },
    fail() {
      wx.showToast({ title: '未选择地点，也可以手动输入地址', icon: 'none' })
    }
  })
}

function openMap(name, address, lat, lng) {
  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    wx.showToast({ title: '这个地点还没标记在地图上', icon: 'none' })
    return
  }
  wx.openLocation({
    latitude: Number(lat),
    longitude: Number(lng),
    name: name || '',
    address: address || '',
    scale: 16
  })
}

function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const rad = Math.PI / 180
  const dLat = (lat2 - lat1) * rad
  const dLng = (lng2 - lng1) * rad
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function distanceText(km) {
  if (km === null || km === undefined || isNaN(km)) return ''
  if (km < 1) return Math.round(km * 1000) + ' 米'
  return km.toFixed(1) + ' 公里'
}

function persistAvatar(tempFilePath, callback) {
  if (!tempFilePath) {
    callback('')
    return
  }
  try {
    const fs = wx.getFileSystemManager()
    fs.saveFile({
      tempFilePath: tempFilePath,
      success(res) {
        callback(res.savedFilePath)
      },
      fail() {
        callback(tempFilePath)
      }
    })
  } catch (e) {
    callback(tempFilePath)
  }
}

module.exports = {
  formatDateTime,
  formatDate,
  formatDateInput,
  formatTime,
  today,
  combineDateTime,
  greeting,
  countdownParts,
  countdownText,
  countdownDetail,
  chooseMapLocation,
  openMap,
  distanceKm,
  distanceText,
  persistAvatar
}
