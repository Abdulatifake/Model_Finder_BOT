// Baza bo'sh qolmasligi uchun namunaviy modellar. Kanaldan haqiqiy import boshlanganda avtomatik o'chiriladi.
export const DEMO_MODELS = [
  {
    name: 'Yashil baxmal divan',
    description: "Yog'och oyoqli, uch o'rinli zamonaviy baxmal divan",
    category: 'sofa',
    tags: ['sofa', 'velvet', 'green', 'modern'],
    previewImageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=640',
  },
  {
    name: 'Sariq kreslo va torshir',
    description: "Mehmonxona uchun sariq kreslo, oltin rang torshir va kichik stolcha",
    category: 'armchair',
    tags: ['armchair', 'yellow', 'floor_lamp', 'living_room'],
    previewImageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=640',
  },
  {
    name: 'Oq klassik kreslo',
    description: "Kapitone uslubidagi oq kreslo, burama oyoqlar bilan",
    category: 'armchair',
    tags: ['armchair', 'classic', 'white', 'tufted'],
    previewImageUrl: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=640',
  },
  {
    name: 'Skandinav uslubidagi yotoqxona',
    description: 'Karavot, tumba va stol chirog\'i',
    category: 'bed',
    tags: ['bed', 'nightstand', 'table_lamp', 'scandinavian'],
    previewImageUrl: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=640',
  },
  {
    name: 'Oq zamonaviy oshxona',
    description: "O'rnatilgan pech va mikroto'lqinli pechli oq oshxona",
    category: 'kitchen',
    tags: ['kitchen', 'white', 'modern', 'oven'],
    previewImageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=640',
  },
];

export const DEMO_IMAGE_URLS = DEMO_MODELS.map((m) => m.previewImageUrl);
