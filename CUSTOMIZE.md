# Make your own edition (no commands)

Everything is controlled by ONE file: **`edition.config.json`**.
Edit it on GitHub (open the file, click the pencil, change, Commit). The build runs by itself and makes a new APK with:
- your **name** on the app, notifications and the **generated icon**
- your **location** as the default for prayer times, Qibla and mosques
- your colours, theme and options

## The settings

| Setting | What it does | Example |
|---|---|---|
| `name` | Person's name. Drawn on the icon, shown in the greeting and footer | `"Ayesha Khan"` |
| `appName` | Name under the icon on the phone (keep it short) | `"Ayesha Quran"` |
| `tagline` | Small text under the name. Use `""` for none | `"Gift Edition"` |
| `dedication` | A short message shown on the home screen | `"Made with love for Ayesha"` |
| `greeting` | Greeting on the home screen | `"Assalamu Alaikum"` |
| `location` | Any place: village, street, town, city. It is looked up on the map automatically | `"Kesavaneri, Kalakkad, Tirunelveli"` |
| `locationLabel` | The name shown in the app for that place | `"Kesavaneri Muslim Street"` |
| `lat`, `lng` | Backup numbers, used only if the place cannot be found. Set `null` if you do not know them | `8.543`, `77.568` |
| `lockCoordinates` | `true` = always use `lat` and `lng` exactly (skips the lookup) | `false` |
| `theme` | Colour theme | see list below |
| `accent` | Any colour in hex that replaces the theme's gold. `""` keeps the theme | `"#E8AA8C"` |
| `method` | Prayer calculation method number | `3` (Muslim World League) |
| `school` | Asr: `0` Shafi'i, `1` Hanafi | `1` |
| `hour24` | `true` for 24-hour clock | `false` |
| `hideSections` | Pages to hide | `["zakat","events"]` |
| `iconStyle` | `"quran"`, `"mosque"`, `"star"` (monogram) or `"custom"` | `"mosque"` |
| `iconArabic` | Arabic line on the icon. `null` = default for the style, `""` = none | `"بسم الله"` |
| `iconBackground` | Icon background colour | `"#0B2E2A"` |
| `iconColor` | Icon gold/line colour | `"#D9AE4E"` |
| `appId` | Leave `""` and it is made from the name. Change it only to install two editions side by side | `""` |

**Themes:** emerald, midnight, rose, onyx, sand, ocean, medina, lapis, andalus, twilight, pearl, saffron
**Pages for hideSections:** month, quran, duas, events, mosques, ibadah, names, tasbih, qibla, zakat
**Calculation methods:** 3 Muslim World League, 1 Karachi, 4 Umm al-Qura, 2 ISNA, 5 Egyptian, 7 Tehran, 8 Gulf, 9 Kuwait, 10 Qatar, 11 Singapore, 12 France, 13 Turkey, 15 Moonsighting

## Use your own picture as the icon
1. Upload a square picture (1024 x 1024) to the `assets` folder named `custom-icon.png`.
2. Set `"iconStyle": "custom"`.

## Changing the location
Just change `location` (and `locationLabel`). The build finds it on the map and prints the numbers it used.
If the full address is not on the map it uses the nearest place it can find, and says so in the build log (Actions tab, step "Apply edition.config.json").
For an exact spot, set `lat` and `lng` and `"lockCoordinates": true`.

## In the app itself
- **Mosques page:** type any place in the world and see the mosques there. "Back to ..." returns to the default place.
- **Location button (top):** search any village, town or street, or use the phone's location.
- **Palette button:** every colour, size and layout option, plus backup and restore.

## Which branch builds?
Only the `zeenath` branch (see the top of `.github/workflows/build-apk.yml`). Pushes to other branches do nothing.
