// Places admins check while writing an answer. `url` takes the search text.
export type Site = { name: string; home: string; note: string; url: (q: string) => string };

const site = (domain: string) => (q: string) =>
  `https://www.google.com/search?q=${encodeURIComponent(`site:${domain} ${q}`)}`;

export const SEARCH_SITES: Site[] = [
  { name: "Quran.com", home: "https://quran.com", note: "Oyatlar, tafsir, o‘zbekcha tarjimalar · Verses, tafsir, Uzbek translations", url: (q) => `https://quran.com/search?q=${encodeURIComponent(q)}` },
  { name: "Sunnah.com", home: "https://sunnah.com", note: "Kutubi sitta va boshqa to‘plamlar, raqam va daraja bilan · Hadith with numbers and grading", url: (q) => `https://sunnah.com/search?q=${encodeURIComponent(q)}` },
  { name: "savollar.islom.uz", home: "https://savollar.islom.uz", note: "O‘zbekiston musulmonlari idorasi Fatvo markazi javoblari · Fatwa Center of Uzbekistan", url: site("savollar.islom.uz") },
  { name: "islom.uz", home: "https://islom.uz", note: "Maqolalar, hadislar, kitoblar · Articles, hadith, books", url: site("islom.uz") },
  { name: "muslim.uz", home: "https://muslim.uz", note: "Musulmonlar idorasining rasmiy sayti · Muslim Board of Uzbekistan", url: site("muslim.uz") },
  { name: "IslamQA.org (Hanafi)", home: "https://islamqa.org", note: "Hanafiy dorul-iftolar javoblari to‘plami · Hanafi darul-iftas collected", url: (q) => `https://islamqa.org/?s=${encodeURIComponent(q)}` },
  { name: "Darul Iftaa Deoband", home: "https://darulifta-deoband.com", note: "Hanafiy fatvolar (inglizcha/urducha) · Hanafi fatwas", url: site("darulifta-deoband.com") },
  { name: "Dorar.net", home: "https://dorar.net", note: "Hadis darajasini tekshirish (arabcha) · Check hadith grading (Arabic)", url: (q) => `https://dorar.net/hadith/search?q=${encodeURIComponent(q)}` },
  { name: "Shamela", home: "https://shamela.ws", note: "Arabcha klassik kitoblar kutubxonasi · Classical Arabic library", url: site("shamela.ws") },
];

export type Book = { title: string; author: string; use: string };

export const BOOKS: { group: string; items: Book[] }[] = [
  {
    group: "Aqida · Creed (Moturidiy)",
    items: [
      { title: "Al-Fiqh al-Akbar", author: "Imom Abu Hanifa", use: "Asosiy aqida masalalari · Core creed" },
      { title: "Al-Aqida at-Tahoviyya", author: "Imom Tahoviy", use: "Ahli sunna aqidasi matni · The Sunni creed text" },
      { title: "Aqoid an-Nasafiyya", author: "Imom Umar Nasafiy", use: "Moturidiy aqida matni, sharhlari bilan · Maturidi creed" },
      { title: "Kitob at-Tavhid", author: "Imom Abu Mansur Moturidiy", use: "Moturidiy maktabi asosi · Foundation of the Maturidi school" },
    ],
  },
  {
    group: "Fiqh · Hanafi",
    items: [
      { title: "Muxtasar al-Quduriy", author: "Imom Quduriy", use: "Qisqa, ishonchli matn · Short reference text" },
      { title: "Al-Hidoya", author: "Burhonuddin Marg‘inoniy", use: "Dalillari bilan asosiy kitob · The main text with evidence" },
      { title: "Radd al-Muhtor (Hoshiya Ibn Obidin)", author: "Ibn Obidin", use: "Mazhabning so‘nggi fatvo manbai · Final word for fatwa" },
      { title: "Al-Fatovo al-Hindiyya", author: "Shayx Nizomuddin va olimlar", use: "Amaliy masalalar · Practical cases" },
      { title: "Badoi’ as-Sanoi’", author: "Imom Koshoniy", use: "Tartibli, dalilli bayon · Systematic, with evidence" },
      { title: "Nur al-Izoh", author: "Hasan Shurunbuloliy", use: "Ibodat (tahorat, namoz, ro‘za) · Worship" },
    ],
  },
  {
    group: "O‘zbek tilida · In Uzbek",
    items: [
      { title: "Kifoya", author: "Shayx Muhammad Sodiq Muhammad Yusuf", use: "Hanafiy fiqhi o‘zbekcha · Hanafi fiqh in Uzbek" },
      { title: "Hadis va hayot", author: "Shayx Muhammad Sodiq Muhammad Yusuf", use: "Mavzular bo‘yicha hadislar sharhi · Hadith by topic" },
      { title: "Tafsiri Hilol", author: "Shayx Muhammad Sodiq Muhammad Yusuf", use: "To‘liq tafsir · Full tafsir" },
      { title: "Qur’oni karim ma’nolarining tarjimasi", author: "Abdulaziz Mansur", use: "Rasmiy o‘zbekcha ma’no tarjimasi · Uzbek meaning translation" },
    ],
  },
];

export const HADITH_COLLECTIONS: Record<string, string> = {
  bukhari: "Sahih al-Buxoriy",
  muslim: "Sahih Muslim",
  abudawud: "Sunan Abu Dovud",
  tirmidhi: "Sunan at-Termiziy",
  nasai: "Sunan an-Nasoiy",
  ibnmajah: "Sunan Ibn Moja",
  malik: "Muvatto Imom Molik",
  ahmad: "Musnad Ahmad",
  other: "Boshqa · Other",
};

export const quranUrl = (surah: number, ayah: number) => `https://quran.com/${surah}/${ayah}`;
export const hadithUrl = (collection: string, number: string) =>
  collection !== "other" && number ? `https://sunnah.com/${collection}:${encodeURIComponent(number)}` : `https://sunnah.com/search?q=${encodeURIComponent(number)}`;
