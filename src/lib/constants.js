import EDITION from '../edition.json'
import { Clock, CalendarDays, BookOpen, HandHeart, Star, MapPin, ListChecks, Sparkles, CircleDot, Compass, Coins, MoonStar, Sunrise, Sun, CloudSun, Sunset, Moon } from 'lucide-react'

export const ICONS = { home: Clock, month: CalendarDays, quran: BookOpen, duas: HandHeart, events: Star, mosques: MapPin, ibadah: ListChecks, names: Sparkles, tasbih: CircleDot, qibla: Compass, zakat: Coins }
export const DEFAULT_LOC = EDITION.loc || { name: 'Tirunelveli, Tamil Nadu', lat: 8.7139, lng: 77.7567 }
export const PRAYERS = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']
export const FIVE = PRAYERS.filter((p) => p !== 'Sunrise')
export const AR = { Fajr: 'الفجر', Sunrise: 'الشروق', Dhuhr: 'الظهر', Asr: 'العصر', Maghrib: 'المغرب', Isha: 'العشاء' }
export const TABS = [['home', 'Prayer'], ['month', 'Monthly'], ['quran', 'Quran'], ['duas', 'Duas'], ['events', 'Events'], ['mosques', 'Mosques'], ['ibadah', 'Ibadah'], ['names', '99 Names'], ['tasbih', 'Tasbih'], ['qibla', 'Qibla'], ['zakat', 'Zakat']]
export const PICON = { Fajr: MoonStar, Sunrise, Dhuhr: Sun, Asr: CloudSun, Maghrib: Sunset, Isha: Moon }
export const SUB = { month: 'Monthly timetable and Hijri calendar', quran: 'Read, search and listen', duas: 'Daily supplications', events: 'Upcoming Islamic dates', mosques: 'Mosques near you', ibadah: 'Khatm and Qada trackers', names: 'The 99 beautiful names of Allah', tasbih: 'Digital dhikr counter', qibla: 'Direction of the Kaaba', zakat: 'Calculate your zakat' }
export const PRIMARY = ['home', 'quran', 'qibla', 'tasbih']
export const PREF0 = { name: EDITION.name, accent: EDITION.accent || '', scale: 1, radius: 'round', glass: true, pattern: true, motion: true, h24: !!EDITION.h24, hidden: EDITION.hidden || [] }
export const SWATCHES = ['#C9A24B', '#D4AF37', '#E8AA8C', '#F472B6', '#C8AAF0', '#60A5FA', '#5AC8D2', '#2DD4BF', '#86EFAC', '#F0BE3C', '#FB923C', '#F87171']
export const BACKUP_KEYS = ['loc', 'alerts', 'done', 'theme', 'calc', 'prefs', 'tasbih2', 'khatm', 'qada', 'gold', 'lastSurah', 'qsize']
export const THEMES = [['emerald', 'Emerald Night', '#0B2E2A', '#C9A24B'], ['midnight', 'Royal Midnight', '#0A1228', '#D4AF37'], ['rose', 'Rose Garden', '#2A0E20', '#E8AA8C'], ['onyx', 'Black & Gold', '#0E0E0E', '#D4AF37'], ['sand', 'Desert Sand (light)', '#F7F1E3', '#966919'], ['ocean', 'Ocean Teal', '#062838', '#78D2C8'], ['medina', 'Green Dome (Madinah)', '#08280F', '#E0BE5A'], ['lapis', 'Persian Lapis', '#0C1840', '#5AC8D2'], ['andalus', 'Andalusian Clay', '#34160E', '#E6AA50'], ['twilight', 'Twilight Violet', '#1A1030', '#C8AAF0'], ['pearl', 'Pearl Garden (light)', '#F4F8F4', '#146E50'], ['saffron', 'Saffron Amber', '#241808', '#F0BE3C']]
export const EVENTS = [['Islamic New Year', 1, 1], ['Day of Ashura', 10, 1], ["Mawlid (Prophet's birthday)", 12, 3], ["Isra and Mi'raj", 27, 7], ['Start of Ramadan', 1, 9], ['Laylat al-Qadr (27th night)', 27, 9], ['Eid al-Fitr', 1, 10], ['Day of Arafah', 9, 12], ['Eid al-Adha', 10, 12]]
export const RAK = { Fajr: 2, Dhuhr: 4, Asr: 4, Maghrib: 3, Isha: 4 }
