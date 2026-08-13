const https = require('https')

exports.main = async (event) => {
  // 支持按活动地点查询当地天气：event.lat / event.lng（浮点数，做了范围校验）
  const lat = Number(event && event.lat)
  const lng = Number(event && event.lng)
  const validLat = isFinite(lat) && lat >= -90 && lat <= 90
  const validLng = isFinite(lng) && lng >= -180 && lng <= 180
  const loc = validLat && validLng ? lat + ',' + lng : ''
  const url = 'https://wttr.in/' + loc + '?format=%C+%t&lang=zh'
  return new Promise(function (resolve) {
    https.get(url, {
      headers: { 'User-Agent': 'curl/7.68.0' }
    }, function (res) {
      let data = ''
      res.setEncoding('utf8')
      res.on('data', function (chunk) { data += chunk })
      res.on('end', function () {
        resolve({ ok: true, text: String(data).trim() })
      })
    }).on('error', function () {
      resolve({ ok: false, text: '' })
    })
  })
}
