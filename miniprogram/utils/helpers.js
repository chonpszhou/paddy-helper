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

function persistPhoto(tempFilePath, folder, callback) {
  const fallback = function () {
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

  if (wx.cloud && wx.cloud.uploadFile) {
    const extMatch = String(tempFilePath).match(/\.(\w+)$/)
    const ext = extMatch ? extMatch[1] : 'jpg'
    wx.cloud.uploadFile({
      cloudPath: 'photos/' + folder + '/' + Date.now() + '-' + Math.floor(Math.random() * 10000) + '.' + ext,
      filePath: tempFilePath
    }).then(function (res) {
      callback(res.fileID)
    }).catch(function () {
      fallback()
    })
  } else {
    fallback()
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
  chooseMapLocation,
  openMap,
  distanceKm,
  distanceText,
  persistAvatar,
  persistPhoto
}
