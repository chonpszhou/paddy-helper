const https = require('https')

exports.main = async () => {
  return new Promise(function (resolve) {
    https.get('https://wttr.in/?format=%C+%t&lang=zh', {
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
