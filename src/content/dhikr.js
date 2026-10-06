// id, group, short name, Arabic, meaning, virtue / source, default goal
export const DHIKR = [
  ['subhanallah', 'After prayer', 'SubhanAllah', 'سُبْحَانَ ٱللَّٰهِ', 'Glory be to Allah', 'Said 33 times after each prayer (Bukhari & Muslim).', 33],
  ['alhamdulillah', 'After prayer', 'Alhamdulillah', 'ٱلْحَمْدُ لِلَّٰهِ', 'All praise is for Allah', 'Said 33 times after each prayer (Bukhari & Muslim).', 33],
  ['allahuakbar', 'After prayer', 'Allahu Akbar', 'ٱللَّٰهُ أَكْبَرُ', 'Allah is the Greatest', 'Said 33 or 34 times after each prayer (Bukhari & Muslim).', 34],
  ['tahlil', 'After prayer', 'Full Tahlil', 'لَا إِلَٰهَ إِلَّا ٱللَّٰهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ ٱلْمُلْكُ وَلَهُ ٱلْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ', 'There is no god but Allah alone, without partner. His is the dominion and His is the praise, and He has power over all things.', 'Completes the 100 after prayer (Muslim). Said 100 times a day, it carries great reward (Bukhari & Muslim).', 1],
  ['lailaha', 'Daily', 'La ilaha illallah', 'لَا إِلَٰهَ إِلَّا ٱللَّٰهُ', 'There is no god but Allah', 'The best of remembrance (Tirmidhi).', 100],
  ['bihamdihi', 'Daily', 'SubhanAllahi wa bihamdihi', 'سُبْحَانَ ٱللَّٰهِ وَبِحَمْدِهِ', 'Glory and praise be to Allah', 'Whoever says it 100 times a day, his sins are forgiven even if like the foam of the sea (Bukhari & Muslim).', 100],
  ['azim', 'Daily', 'SubhanAllahil Azim', 'سُبْحَانَ ٱللَّٰهِ وَبِحَمْدِهِ سُبْحَانَ ٱللَّٰهِ ٱلْعَظِيمِ', 'Glory and praise be to Allah; glory be to Allah the Magnificent', 'Two phrases light on the tongue, heavy on the scale, beloved to the Most Merciful (Bukhari & Muslim).', 100],
  ['hawqala', 'Daily', 'La hawla wa la quwwata', 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِٱللَّٰهِ', 'There is no power and no strength except with Allah', 'A treasure from the treasures of Paradise (Bukhari & Muslim).', 100],
  ['istighfar', 'Forgiveness', 'Astaghfirullah', 'أَسْتَغْفِرُ ٱللَّٰهَ', 'I seek forgiveness from Allah', 'The Prophet ﷺ sought Allah\'s forgiveness many times every day (Bukhari & Muslim).', 100],
  ['salawat', 'Salawat', 'Salawat on the Prophet ﷺ', 'ٱللَّٰهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ', 'O Allah, send blessings upon Muhammad', 'Whoever sends one blessing upon me, Allah sends ten upon him (Muslim).', 100],
  ['hasbunallah', 'Dua', 'Hasbunallah', 'حَسْبُنَا ٱللَّٰهُ وَنِعْمَ ٱلْوَكِيلُ', 'Allah is enough for us, and He is the best protector', 'Words of reliance on Allah (Quran 3:173, Bukhari).', 100],
  ['yunus', 'Dua', 'Dua of Yunus ﷺ', 'لَا إِلَٰهَ إِلَّا أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ ٱلظَّالِمِينَ', 'There is no god but You, glory be to You; I was among the wrongdoers', 'The prayer of Yunus ﷺ (Quran 21:87). The Prophet ﷺ said Allah answers whoever calls with it (Tirmidhi).', 100],
]

export const CUSTOM_ID = 'custom'
export const CATS = ['All', 'After prayer', 'Daily', 'Forgiveness', 'Salawat', 'Dua']
export const GUIDED = ['subhanallah', 'alhamdulillah', 'allahuakbar', 'tahlil']
export const dhikrOf = (id, c) => id === CUSTOM_ID ? [CUSTOM_ID, 'Custom', c?.name || 'My dhikr', c?.ar || '', '', 'Your own dhikr. Type any name or text you like.', 33] : DHIKR.find((d) => d[0] === id) || DHIKR[0]
export const GUIDED_GOAL = { subhanallah: 33, alhamdulillah: 33, allahuakbar: 34, tahlil: 1 }
export const TS0 = { sel: 'subhanallah', counts: {}, goals: {}, days: {}, total: 0, vib: true, snd: false, guided: false, step: 0, gc: 0, custom: { name: 'My dhikr', ar: '' }, cat: 'All' }
