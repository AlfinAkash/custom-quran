# Prayer & Quran App: How to Use

A prayer times, Quran and Islamic companion app that you can turn into **your own personal edition**: your name on the icon, your location, your colours. It builds an Android APK for you online. **You do not need to type any commands.**

---

## 1. What is inside

- Prayer times with live countdown, Hijri date and daily prayer tracker
- Monthly timetable and calendar
- Quran (read, search, listen), Duas, Islamic events, 99 Names
- Mosques near you, and search for mosques in **any place**
- Tasbih counter, Qibla compass, Zakat calculator, Quran Khatm and Qada trackers
- Android alerts: adhan at prayer time, reminders before and after, "I prayed" and "Remind in 10 min" buttons, adhkar, Friday Al-Kahf and Monday/Thursday fast reminders
- Works on phone and laptop, with 12 themes and many customization options

---

## 2. Get the APK (first time)

You need a free GitHub account. Everything is done in the browser.

1. Sign in at **github.com** and create a new repository (any name).
2. Create a branch named **`zeenath`** (click the branch button, type `zeenath`, create it). Stay on this branch.
3. Click **Add file → Upload files**. Unzip this project and drag **all** files and folders into the page. Make sure these are included:
   - the hidden **`.github`** folder (in Windows File Explorer turn on View → Show → Hidden items)
   - the **`signing`** folder
   - the **`assets`** folder
4. Click **Commit changes**.
5. Open the **Actions** tab. A build called **Build Android APK** starts by itself. It takes about 5 to 8 minutes. Wait for the **green tick**.
6. Open **Releases** (right side of the repository's main page). Under **Assets**, download the file ending in **`.apk`**.
7. Send the APK to the phone and open it. Allow **Install unknown apps** if Android asks.
8. On the first launch, tap **Allow and continue** so notifications and location work.

> The build only runs on the `zeenath` branch. Uploading to other branches does nothing.

---

## 3. Make it yours (name, location, icon, colours)

Everything is controlled by **one file: `edition.config.json`**.

1. In your repository (on the `zeenath` branch), open **`edition.config.json`**.
2. Click the **pencil icon** (Edit).
3. Change the values you want (see the table below). Keep the quotes and commas as they are.
4. Click **Commit changes**.
5. The build starts again by itself. When the green tick appears, download the new APK from **Releases**.

### Settings

| Setting | What it does | Example |
|---|---|---|
| `name` | Person's name. It is drawn on the icon and shown in the greeting and footer | `"Ayesha Khan"` |
| `appName` | Short name under the icon on the phone | `"Ayesha Quran"` |
| `tagline` | Small text under the name. `""` for none | `"Gift Edition"` |
| `dedication` | A short message shown on the home screen | `"Made with love for Ayesha"` |
| `greeting` | Greeting on the home screen | `"Assalamu Alaikum"` |
| `location` | Any village, street, town or city. It is found on the map automatically | `"Kesavaneri, Kalakkad, Tirunelveli"` |
| `locationLabel` | Name of the place shown in the app | `"Kesavaneri Muslim Street"` |
| `lat`, `lng` | Backup map numbers, used only if the place can't be found | `8.543`, `77.568` |
| `lockCoordinates` | `true` = always use `lat` and `lng` exactly | `false` |
| `theme` | Colour theme | `"emerald"` |
| `accent` | Any colour code that replaces the gold. `""` keeps the theme | `"#E8AA8C"` |
| `method` | Prayer calculation method number | `3` |
| `school` | Asr: `0` Shafi'i, `1` Hanafi | `1` |
| `hour24` | `true` for 24-hour clock | `false` |
| `hideSections` | Pages to hide | `["zakat","events"]` |
| `iconStyle` | `"quran"`, `"mosque"`, `"star"` (initials) or `"custom"` | `"mosque"` |
| `iconArabic` | Arabic line on the icon. `null` = default for the style, `""` = none | `"بسم الله"` |
| `iconBackground` | Icon background colour | `"#0B2E2A"` |
| `iconColor` | Icon gold / line colour | `"#D9AE4E"` |
| `appId` | Leave `""`. It is made from the name | `""` |

**Themes:** emerald, midnight, rose, onyx, sand, ocean, medina, lapis, andalus, twilight, pearl, saffron

**Pages you can hide:** month, quran, duas, events, mosques, ibadah, names, tasbih, qibla, zakat

**Calculation methods:** 3 Muslim World League, 1 Karachi, 4 Umm al-Qura, 2 ISNA, 5 Egyptian, 7 Tehran, 8 Gulf, 9 Kuwait, 10 Qatar, 11 Singapore, 12 France, 13 Turkey, 15 Moonsighting

### Examples

**A different person, a different place**
```json
{
  "name": "Ayesha Khan",
  "appName": "Ayesha Quran",
  "tagline": "Gift Edition",
  "location": "Mylapore, Chennai, Tamil Nadu",
  "locationLabel": "Mylapore, Chennai",
  "lat": null,
  "lng": null,
  "iconStyle": "mosque"
}
```

**Use your own picture as the icon**
1. Upload a square picture (1024 x 1024) into the **`assets`** folder, named **`custom-icon.png`**.
2. Set `"iconStyle": "custom"` in `edition.config.json`.

### Changing the location
Just change `location` and `locationLabel`. The build finds the place on the map. If the exact address is not on the map, it uses the nearest place it can find and says so in the build log. For an exact spot, set `lat` and `lng` and `"lockCoordinates": true`. After installing, the person can also tap the location button in the app and choose **Use my location**.

---

## 4. Using the app

- **Prayer page:** next prayer countdown and today's progress. Tap a prayer to mark it done.
- **Mosques page:** shows mosques near the default place. Type any place in the search box to see mosques there. "Back to ..." returns to the default place.
- **Location button (top):** search any village, town or street, or use the phone's location.
- **Palette button (top):** change theme, colours, text size, corners and more. It also has **Backup** and **Restore**, which save your data to a file.
- **Alerts (bell button):** turn prayer alerts on, choose before/at/after reminders, send a test, and switch on the extra reminders. The Android section shows your next alerts and a **Refresh alerts** button.

### If alerts are late or missing on the phone
- Android Settings → Apps → the app → **Notifications**: allow.
- Android Settings → Apps → the app → **Battery**: set to **Unrestricted**.
- On Xiaomi, Oppo, Vivo, Realme and Samsung phones, also allow **Autostart**.
- Open the app once every week or two so alerts are refreshed. The app reminds you.

---

## 5. Updating and installing

- Every build is signed with the same key, so a **new APK installs over the old one** and keeps the data.
- Changing the **name** changes the app ID, so it installs as a **separate app** next to the old one. Uninstall the old one if you do not want both.
- Each build gets a new version number automatically.

---

## 6. Troubleshooting

| Problem | What to do |
|---|---|
| No build starts | You must be on the **`zeenath`** branch. Check the **`.github`** folder was uploaded. |
| Build shows a red cross | Open the failed run in **Actions**, open the failed step, copy the last 30 lines and ask for help. |
| "edition.config.json has a typo" | A quote, comma or bracket is missing. Compare with the examples above. |
| "Could not find ... on the map" | Use a simpler location (village or town and district), or set `lat` and `lng`. |
| Icon text looks cut off or small | Round icons crop the edges. Use a shorter `name`, or `"iconStyle": "star"` which shows initials. |
| Name in Tamil or another script missing on the icon | Only Latin and Arabic fonts are included. Use an English spelling, or use a custom icon. |
| No Releases section | Open the run's summary page in **Actions** and download **Prayer-APK** at the bottom. |
| Old icon still shows | Uninstall the old app first, then install the new APK. |

---

## 7. Optional: build on your Windows PC

Double-click **`build-apk.bat`**. It needs **Node 20** and **Android Studio** (open Android Studio once so it installs the Android SDK). The APK appears as **`Prayer-App.apk`** in the same folder.

---

## 8. What is in the folders

- **`edition.config.json`**: the one file you edit
- **`CUSTOMIZE.md`**: short guide to the settings
- **`.github/workflows`**: the online build (runs on the `zeenath` branch)
- **`scripts`**: the tools that apply your settings and make the icon
- **`assets`**: the generated icon, bundled fonts, and where `custom-icon.png` goes
- **`signing`**: the fixed key so updates install over old versions
- **`src`**, **`public`**: the app itself

Data comes from free public services: AlAdhan (prayer times), AlQuran Cloud (Quran), Open-Meteo and OpenStreetMap (places and mosques). No account or key is needed.