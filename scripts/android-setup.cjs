// Run once after "cap add android": adds the adhan sound, notification icon and Android permissions.
const fs = require('fs'), path = require('path')
const main = path.join('android', 'app', 'src', 'main')
let BG = '#0B2E2A'
try { BG = JSON.parse(fs.readFileSync(path.join('src', 'edition.json'), 'utf8')).bg || BG } catch { /* default */ }
if (!fs.existsSync(main)) { console.error('Android project not found. Run "npm run apk:add" first.'); process.exit(1) }

// 1. Adhan sound for the notification channel
fs.mkdirSync(path.join(main, 'res', 'raw'), { recursive: true })
fs.copyFileSync(path.join('public', 'adhan.mp3'), path.join(main, 'res', 'raw', 'adhan.mp3'))

// 2. White crescent for the status bar
fs.mkdirSync(path.join(main, 'res', 'drawable'), { recursive: true })
fs.writeFileSync(path.join(main, 'res', 'drawable', 'ic_stat_prayer.xml'),
`<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="24dp" android:height="24dp" android:viewportWidth="24" android:viewportHeight="24">
    <path android:fillColor="#FFFFFFFF" android:pathData="M12,3c-4.97,0 -9,4.03 -9,9s4.03,9 9,9 9,-4.03 9,-9c0,-0.46 -0.04,-0.92 -0.1,-1.36 -0.98,1.37 -2.58,2.26 -4.4,2.26 -2.98,0 -5.4,-2.42 -5.4,-5.4 0,-1.81 0.89,-3.42 2.26,-4.4 -0.44,-0.06 -0.9,-0.1 -1.36,-0.1z"/>
</vector>
`)

// 2b. Large notification icon + branded launch screen
try {
  const res = path.join(main, 'res')
  fs.copyFileSync(path.join('public', 'icon-192.png'), path.join(res, 'drawable', 'notif_large.png'))
  for (const d of fs.readdirSync(res)) {
    if (!d.startsWith('drawable')) continue
    for (const f of fs.readdirSync(path.join(res, d))) if (/^splash\.(png|jpg|webp|xml)$/.test(f)) fs.rmSync(path.join(res, d, f))
  }
  fs.writeFileSync(path.join(res, 'drawable', 'splash.xml'),
`<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <item><shape android:shape="rectangle"><solid android:color="${BG}"/></shape></item>
    <item android:width="150dp" android:height="150dp" android:gravity="center"><bitmap android:gravity="fill" android:src="@drawable/notif_large"/></item>
</layer-list>
`)
  const sf = path.join(res, 'values', 'styles.xml')
  if (fs.existsSync(sf)) {
    let x = fs.readFileSync(sf, 'utf8')
    const m = x.match(/<style name="AppTheme\.NoActionBarLaunch"[^>]*>/)
    if (m && /Theme\.SplashScreen/.test(m[0])) {
      const items = [['windowSplashScreenBackground', BG], ['windowSplashScreenAnimatedIcon', '@drawable/notif_large']].filter(([n]) => !x.includes('name="' + n + '"'))
      if (items.length) { x = x.replace(m[0], m[0] + '\n' + items.map(([n, v]) => '        <item name="' + n + '">' + v + '</item>').join('\n')); fs.writeFileSync(sf, x) }
    }
  }
} catch (e) { console.warn('Splash/large icon step skipped:', e.message) }

// 3. Permissions
const file = path.join(main, 'AndroidManifest.xml')
let xml = fs.readFileSync(file, 'utf8')
const perms = ['INTERNET', 'POST_NOTIFICATIONS', 'SCHEDULE_EXACT_ALARM', 'USE_EXACT_ALARM', 'RECEIVE_BOOT_COMPLETED', 'VIBRATE', 'WAKE_LOCK', 'ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION']
const add = perms.filter((p) => !xml.includes(`android.permission.${p}"`)).map((p) => `    <uses-permission android:name="android.permission.${p}" />`)
if (add.length) xml = xml.replace('</manifest>', add.join('\n') + '\n</manifest>')
fs.writeFileSync(file, xml)
console.log('Android setup done: adhan sound, notification icon, ' + add.length + ' permissions added.')
