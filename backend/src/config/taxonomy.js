// Kategoriyalar ustuvorlik tartibida: model bir nechta hashtegga ega bo'lsa, ro'yxatda birinchi mos kelgani tanlanadi.
// Kanal 3dsky hashteglaridan foydalanadi: inglizcha (#sofa) va ruscha (#диван) aralash.
export const CATEGORY_RULES = [
  { key: 'sofa', tokens: ['sofa', 'sofas', 'couch', 'couches', 'sofa_bed', 'диван', 'диваны', 'софа', 'divan'] },
  { key: 'armchair', tokens: ['armchair', 'armchairs', 'lounge_chair', 'кресло', 'кресла', 'kreslo'] },
  {
    key: 'chair',
    tokens: [
      'chair', 'chairs', 'stool', 'stools', 'bar_stool', 'table_chair', 'стул', 'стулья', 'табурет', 'барныйстул',
      'столстул', 'stul',
    ],
  },
  {
    key: 'table',
    tokens: [
      'table', 'tables', 'coffee_table', 'dining_table', 'console', 'desk', 'стол', 'столы', 'столик', 'консоль',
      'журнальныйстол', 'кофейныйстолик', 'туалетныйстолик', 'дамскийстолик', 'рабочееместо', 'stol',
    ],
  },
  { key: 'bed', tokens: ['bed', 'beds', 'bedside', 'кровать', 'кровати', 'постельное', 'karavot'] },
  {
    key: 'storage',
    tokens: [
      'wardrobe', 'wardrobes', 'cupboard', 'sideboard', 'credenza', 'cabinet', 'cabinets', 'chest_of_drawer',
      'chest_of_drawers', 'shelf', 'shelves', 'rack', 'storage', 'bookcase', 'шкаф', 'шкафы', 'комод', 'стеллаж',
      'тумба', 'гардероб', 'твстенка', 'стенка', 'прихожая', 'shkaf',
    ],
  },
  {
    key: 'lighting',
    tokens: [
      'lighting', 'light', 'lamp', 'lamps', 'chandelier', 'pendant', 'pendant_light', 'pendant_lamp', 'floor_lamp',
      'floorlamp', 'table_lamp', 'tablelamp', 'ceiling_lamp', 'ceiling_light', 'wall_light', 'walllight', 'wall_lamp',
      'sconce', 'suspension', 'освещение', 'светильник', 'люстра', 'люстры', 'лампа', 'бра', 'торшер', 'торшеры',
      'подвесной', 'подвес', 'настольная', 'потолочный', 'напольный', 'кулон', 'свет', 'chiroq',
    ],
  },
  {
    key: 'kitchen',
    tokens: [
      'kitchen', 'kitchen_appliance', 'oven', 'fridge', 'dishes', 'plate', 'teapot', 'food', 'кухня', 'кухни',
      'техникадлякухни', 'кухоннаятехника', 'холодильник', 'декордлякухни', 'посуда', 'духовка', 'вытяжка', 'мойка',
      'еданапитки', 'бытоваятехника',
    ],
  },
  {
    key: 'bathroom',
    tokens: [
      'bathroom', 'bathroom_accessories', 'bathroom_furniture', 'sink', 'faucet', 'mixer', 'shower', 'towel',
      'washbasin', 'bath', 'bathtub', 'toilet', 'bidet', 'jacuzzi', 'ванная', 'санузел', 'раковина', 'смеситель',
      'сантехника', 'умывальники', 'ванна', 'мебельдляванны', 'декордляванны', 'душ', 'душевая', 'полотенца',
    ],
  },
  { key: 'kids', tokens: ['childroom', 'children', 'kids', 'toys', 'toy', 'детская', 'детскаямебель', 'игрушки'] },
  // Aniq dekor buyumlari o'simlikdan ustun: "gullar solingan vaza" — bu vaza
  {
    key: 'decor',
    tokens: [
      'vase', 'vases', 'sculpture', 'statuette', 'candle', 'candlestick', 'mirror', 'clock', 'frame', 'picture',
      'painting', 'ваза', 'вазы', 'зеркало', 'картина', 'картины', 'скульптура', 'часы', 'багеты',
    ],
  },
  {
    key: 'plants',
    tokens: [
      'plants', 'plant', 'flower', 'flowers', 'bouquet', 'tree', 'trees', 'bush', 'grass', 'palm', 'flowerpot',
      'greenery', 'moss', 'растения', 'растение', 'комнатныерастения', 'цветы', 'букеты', 'деревья', 'кусты',
      'кактус', 'трава', 'фитостены', 'сухостой',
    ],
  },
  {
    key: 'decor',
    tokens: [
      'decor', 'décor', 'decore', 'decoration', 'decorative', 'decorative_set', 'other_decorative_objects',
      'otherdecorativeobjects', 'pillow', 'pillows', 'plaid', 'blanket', 'book', 'books', 'carpet', 'carpets', 'rug',
      'curtain', 'curtains', 'textile', 'art', 'panel', 'basket', 'box', 'accessories', 'clothes', 'декор',
      'декоративныйнабор', 'подушки', 'плед', 'книги', 'ковер', 'ковры', 'шторы', 'одежда', 'другиепредметыинтерьера',
    ],
  },
  {
    key: 'tech',
    tokens: [
      'technology', 'tv', 'appliances', 'transport', 'car', 'sockets', 'switches', 'техника', 'транспорт',
      'автомобиль', 'электроника', 'аудиотехника', 'выключатели', 'розетки',
    ],
  },
  {
    key: 'outdoor',
    tokens: [
      'outdoor', 'garden', 'exterior', 'street', 'landscape', 'экстерьер', 'уличные', 'ланшафт', 'город',
      'городскаясреда', 'брусчатка', 'здание', 'деталиокружающейсреды',
    ],
  },
  {
    key: 'architecture',
    tokens: [
      'architecture', 'door', 'doors', 'window', 'windows', 'fireplace', 'biofireplace', 'stairs', 'staircase',
      'ceiling', 'moulding', 'mouldings', 'molding', 'moldings', 'boiserie', 'архитектура', 'двери', 'окна', 'камин',
      'лестницы', 'перегородка', 'лепнина', '3dпанель', 'стены',
    ],
  },
  {
    key: 'materials',
    tokens: [
      'materials', 'material', 'texture', 'textures', 'tile', 'laminate', 'brick', 'plaster', 'материалы', 'текстуры',
      'текстура', 'плитка', 'кафель', 'пол', 'паркет', 'ламинат', 'декоративнаяштукатурка', 'кирпич', 'камень', 'мрамор',
    ],
  },
  {
    key: 'furniture',
    tokens: [
      'furniture', 'pouf', 'puff', 'poof', 'ottoman', 'bench', 'banquet', 'мебель', 'пуф', 'банкетка', 'скамья',
      'офиснаямебель', 'другаямягкаямебель', 'ресепшен',
    ],
  },
];

export const CATEGORY_KEYS = [...new Set([...CATEGORY_RULES.map((c) => c.key), 'other'])];

// OWL-ViT uchun inglizcha so'rovlar -> foydalanuvchiga ko'rsatiladigan guruh kaliti
export const DETECTION_LABELS = {
  sofa: 'sofa',
  armchair: 'armchair',
  chair: 'chair',
  stool: 'chair',
  ottoman: 'pouf',
  'coffee table': 'table',
  'dining table': 'table',
  'side table': 'table',
  desk: 'desk',
  nightstand: 'nightstand',
  bed: 'bed',
  'floor lamp': 'lamp',
  'table lamp': 'lamp',
  'pendant lamp': 'lamp',
  chandelier: 'chandelier',
  wardrobe: 'cabinet',
  cabinet: 'cabinet',
  'tv stand': 'cabinet',
  'kitchen cabinets': 'kitchen',
  shelf: 'shelf',
  rug: 'rug',
  curtain: 'curtain',
  mirror: 'mirror',
  'potted plant': 'plant',
  vase: 'vase',
  painting: 'painting',
  television: 'tv',
  pillow: 'pillow',
  bathtub: 'bathtub',
  sink: 'sink',
  toilet: 'toilet',
  fireplace: 'fireplace',
  oven: 'appliance',
  microwave: 'appliance',
};
