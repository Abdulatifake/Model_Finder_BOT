// Ko'p tilli matn modeli o'zbek tilini deyarli tushunmaydi, arab tilida esa interyer atamalarida adashadi
// (masalan "ثريا" — qandil, lekin ism ham). Shuning uchun asosiy atamalar embedding'dan oldin inglizchaga o'giriladi.
const PHRASES = {
  'burchak divan': 'corner sofa',
  'ovqat stoli': 'dining table',
  'jurnal stoli': 'coffee table',
  'yozuv stoli': 'desk',
  'kompyuter stoli': 'computer desk',
  'kitob javoni': 'bookshelf',
  'kiyim shkafi': 'wardrobe',
  'tv tumba': 'tv stand',
  'bar stuli': 'bar stool',
  'oshxona garnituri': 'kitchen cabinets',
  'yotoq xonasi': 'bedroom',
  'mehmon xonasi': 'living room',
  'bolalar xonasi': 'kids room',
  'vanna xonasi': 'bathroom',
  "pol chirog'i": 'floor lamp',
  "stol chirog'i": 'table lamp',
  "devor chirog'i": 'wall lamp',
  "qo'l yuvgich": 'sink',
  "uch o'rinli": 'three-seater',
  "ikki o'rinli": 'two-seater',
  "to'q rang": 'dark',
  'ётоқ хонаси': 'bedroom',
  'меҳмон хонаси': 'living room',
  'овқат столи': 'dining table',
  'журнал столи': 'coffee table',
};

const WORDS = {
  // xonalar
  oshxona: 'kitchen', yotoqxona: 'bedroom', mehmonxona: 'living room', zal: 'living room', hammom: 'bathroom',
  ofis: 'office', kabinet: 'home office', dahliz: 'hallway', koridor: 'hallway', balkon: 'balcony', ayvon: 'terrace',
  restoran: 'restaurant', kafe: 'cafe', xona: 'room', interyer: 'interior', eksteryer: 'exterior', uy: 'house',
  // mebel
  divan: 'sofa', kreslo: 'armchair', stul: 'chair', stol: 'table', stolcha: 'side table', karavot: 'bed',
  krovat: 'bed', tumba: 'nightstand', komod: 'dresser', shkaf: 'wardrobe', garderob: 'wardrobe', javon: 'shelf',
  polka: 'shelf', pufik: 'pouf', puf: 'pouf', taburetka: 'stool', skameyka: 'bench', "o'rindiq": 'seat',
  trumo: 'dressing table', garnitur: 'furniture set', mebel: 'furniture', kushetka: 'daybed', banketka: 'bench',
  // yoritish
  chiroq: 'lamp', "chirog'i": 'lamp', lampa: 'lamp', qandil: 'chandelier', lyustra: 'chandelier',
  torshir: 'floor lamp', bra: 'wall sconce', "yoritgich": 'light fixture',
  // dekor
  gilam: 'rug', parda: 'curtain', oyna: 'mirror', "ko'zgu": 'mirror', deraza: 'window', eshik: 'door',
  kamin: 'fireplace', "o'simlik": 'plant', gul: 'flower', guldon: 'vase', vaza: 'vase', rasm: 'painting',
  kartina: 'painting', yostiq: 'pillow', adyol: 'blanket', soat: 'clock', haykal: 'sculpture', dekor: 'decor',
  panno: 'wall panel', zina: 'stairs', narvon: 'stairs', shift: 'ceiling', pol: 'floor', devor: 'wall',
  // hammom / oshxona
  vanna: 'bathtub', dush: 'shower', unitaz: 'toilet', rakovina: 'sink', plita: 'stove', muzlatgich: 'fridge',
  // material
  "yog'och": 'wooden', "yog'ochdan": 'wooden', metall: 'metal', temir: 'iron', shisha: 'glass', marmar: 'marble',
  charm: 'leather', teri: 'leather', baxmal: 'velvet', mato: 'fabric', tosh: 'stone', beton: 'concrete',
  rattan: 'rattan', "to'qima": 'woven',
  // ranglar
  oq: 'white', qora: 'black', kulrang: 'grey', qizil: 'red', "ko'k": 'blue', havorang: 'light blue',
  yashil: 'green', sariq: 'yellow', jigarrang: 'brown', pushti: 'pink', binafsha: 'purple', oltin: 'gold',
  tilla: 'gold', kumush: 'silver', bej: 'beige', "to'q": 'dark', och: 'light',
  // uslub / shakl
  zamonaviy: 'modern', klassik: 'classic', neoklassik: 'neoclassical', minimalist: 'minimalist',
  skandinav: 'scandinavian', yumshoq: 'soft', katta: 'large', kichik: 'small', dumaloq: 'round',
  "to'rtburchak": 'rectangular', uzun: 'long', osma: 'hanging', devoriy: 'wall-mounted', burchak: 'corner',
  bolalar: 'kids', hashamatli: 'luxury', oddiy: 'simple', qulay: 'comfortable',
  // kirill yozuvidagi o'zbekcha
  ошхона: 'kitchen', ётоқхона: 'bedroom', меҳмонхона: 'living room', ҳаммом: 'bathroom', каравот: 'bed',
  чироқ: 'lamp', қандил: 'chandelier', гилам: 'rug', парда: 'curtain', ойна: 'mirror', кўзгу: 'mirror',
  ёстиқ: 'pillow', ёғоч: 'wooden', оқ: 'white', қора: 'black', кулранг: 'grey', қизил: 'red', кўк: 'blue',
  яшил: 'green', сариқ: 'yellow', жигарранг: 'brown', замонавий: 'modern', юмшоқ: 'soft', катта: 'large',
  кичик: 'small', жавон: 'shelf', гулдон: 'vase', расм: 'painting', ўсимлик: 'plant', эшик: 'door',
  дераза: 'window', тумба: 'nightstand',
};

const ARABIC_PHRASES = {
  'كرسي بذراعين': 'armchair',
  'كرسي بار': 'bar stool',
  'طاولة طعام': 'dining table',
  'طاولة الطعام': 'dining table',
  'طاولة قهوة': 'coffee table',
  'طاولة القهوة': 'coffee table',
  'طاولة جانبية': 'side table',
  'خزانة ملابس': 'wardrobe',
  'خزانة الملابس': 'wardrobe',
  'مصباح أرضي': 'floor lamp',
  'مصباح طاولة': 'table lamp',
  'مصباح حائط': 'wall lamp',
  'حوض استحمام': 'bathtub',
  'رف كتب': 'bookshelf',
  'رف الكتب': 'bookshelf',
  'غرفة نوم': 'bedroom',
  'غرفة النوم': 'bedroom',
  'غرفة معيشة': 'living room',
  'غرفة المعيشة': 'living room',
  'غرفة الجلوس': 'living room',
  'غرفة أطفال': 'kids room',
  'غرفة الأطفال': 'kids room',
};

const ARABIC_WORDS = {
  // mebel
  أريكة: 'sofa', كنبة: 'sofa', كنب: 'sofa', أرائك: 'sofa', صوفا: 'sofa', كرسي: 'chair', كراسي: 'chair',
  مقعد: 'seat', بوف: 'pouf', طاولة: 'table', ترابيزة: 'table', مكتب: 'desk', سرير: 'bed', أسرة: 'bed',
  كومودينو: 'nightstand', تسريحة: 'dressing table', خزانة: 'wardrobe', خزائن: 'wardrobe', دولاب: 'wardrobe',
  رف: 'shelf', رفوف: 'shelf', مكتبة: 'bookcase', بوفيه: 'sideboard',
  // yoritish
  ثريا: 'chandelier', نجفة: 'chandelier', مصباح: 'lamp', مصابيح: 'lamp', لمبة: 'lamp', أباجورة: 'table lamp',
  إضاءة: 'lighting', إنارة: 'lighting',
  // dekor
  سجادة: 'rug', سجاد: 'rug', ستارة: 'curtain', ستائر: 'curtain', مرآة: 'mirror', مزهرية: 'vase', فازة: 'vase',
  وسادة: 'pillow', وسائد: 'pillow', مخدة: 'pillow', لوحة: 'painting', ديكور: 'decor', ساعة: 'clock',
  شمعة: 'candle', تمثال: 'sculpture',
  // o'simlik
  نبات: 'plant', نبتة: 'plant', زهور: 'flowers', ورد: 'flowers', شجرة: 'tree', أصيص: 'flowerpot',
  // xonalar / hammom
  مطبخ: 'kitchen', حمام: 'bathroom', مغسلة: 'sink', مرحاض: 'toilet', دش: 'shower', بانيو: 'bathtub',
  غرفة: 'room', صالة: 'living room', صالون: 'living room', باب: 'door', نافذة: 'window', شباك: 'window',
  مدفأة: 'fireplace', درج: 'stairs',
  // ranglar
  أبيض: 'white', بيضاء: 'white', أسود: 'black', سوداء: 'black', رمادي: 'grey', أحمر: 'red', حمراء: 'red',
  أزرق: 'blue', زرقاء: 'blue', أخضر: 'green', خضراء: 'green', أصفر: 'yellow', صفراء: 'yellow', بني: 'brown',
  بيج: 'beige', ذهبي: 'gold', فضي: 'silver', وردي: 'pink',
  // material / uslub
  خشب: 'wood', خشبي: 'wooden', معدن: 'metal', معدني: 'metal', زجاج: 'glass', زجاجي: 'glass', رخام: 'marble',
  جلد: 'leather', جلدي: 'leather', مخمل: 'velvet', قماش: 'fabric', حجر: 'stone', خيزران: 'rattan',
  حديث: 'modern', عصري: 'modern', كلاسيكي: 'classic', فاخر: 'luxury', بسيط: 'minimalist', كبير: 'large',
  صغير: 'small', دائري: 'round', مريح: 'comfortable',
};

// Arabcha yozuvdagi harakatlar, tatvil va alif shakllari bir xil ko'rinishga keltiriladi
function normalizeArabic(text) {
  return text
    .replace(/[ً-ٰٟـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي');
}

for (const [phrase, en] of Object.entries(ARABIC_PHRASES)) PHRASES[normalizeArabic(phrase)] = en;
for (const [word, en] of Object.entries(ARABIC_WORDS)) WORDS[normalizeArabic(word)] = en;

// O'zbek tilidagi qo'shimchalar (uzunidan qisqasiga): divanlar -> divan, stoli -> stol, karavoti -> karavot
const SUFFIXES = [
  'larimiz', 'laringiz', 'lardagi', 'laridan', 'lardan', 'larning', 'larini', 'lariga', 'larda', 'larga',
  'lari', 'lar', 'dagi', 'ning', 'dan', 'lik', 'siz', 'ni', 'da', 'ga', 'si', 'li', 'i',
  'лари', 'лар', 'даги', 'нинг', 'дан', 'ни', 'да', 'га', 'си', 'ли', 'и',
];

// Arabcha: "ال" artikli va old qo'shimchalar, "ة" (muannas) va "ات" (ko'plik) qo'shimchalari
const ARABIC_PREFIXES = ['وال', 'بال', 'فال', 'كال', 'لل', 'ال'];

function arabicStems(word) {
  const prefix = ARABIC_PREFIXES.find((p) => word.startsWith(p) && word.length - p.length >= 2);
  const stems = prefix ? [word, word.slice(prefix.length)] : [word];
  for (const stem of [...stems]) {
    if (stem.endsWith('ة')) stems.push(stem.slice(0, -1));
    if (stem.endsWith('ات')) stems.push(`${stem.slice(0, -2)}ة`, stem.slice(0, -2));
  }
  return stems;
}

function normalizeApostrophes(text) {
  return text.replace(/[‘’ʻʼ`´]/g, "'");
}

function translateWord(word) {
  if (WORDS[word]) return WORDS[word];
  if (/[؀-ۿ]/.test(word)) {
    const stem = arabicStems(word).find((s) => WORDS[s]);
    return stem ? WORDS[stem] : null;
  }
  for (const suffix of SUFFIXES) {
    if (word.length - suffix.length >= 3 && word.endsWith(suffix)) {
      const stem = word.slice(0, -suffix.length);
      if (WORDS[stem]) return WORDS[stem];
    }
  }
  return null;
}

export function translateQuery(text) {
  let q = normalizeArabic(normalizeApostrophes(String(text).toLowerCase())).trim();

  for (const [phrase, en] of Object.entries(PHRASES)) {
    if (q.includes(phrase)) q = q.split(phrase).join(en);
  }

  return q
    .split(/\s+/)
    .map((word) => translateWord(word) ?? word)
    .join(' ');
}
