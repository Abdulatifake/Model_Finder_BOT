// Kategoriya qoidalari (src/config/taxonomy.js) o'zgargandan keyin kanal modellarining kategoriyasini qayta hisoblaydi.
// Rasmlar va embedding'lar qayta hisoblanmaydi, shuning uchun tez ishlaydi.
import { prisma } from '../src/database/connection.js';
import { detectCategory } from '../src/services/captionParser.js';

let lastId = 0;
let checked = 0;
let changed = 0;

for (;;) {
  const rows = await prisma.model3D.findMany({
    where: { id: { gt: lastId }, telegramMessageId: { not: null } },
    orderBy: { id: 'asc' },
    take: 2000,
    select: { id: true, name: true, tags: true, category: true },
  });
  if (!rows.length) break;

  const byCategory = new Map();
  for (const row of rows) {
    const category = detectCategory(row.tags, row.name);
    if (category !== row.category) byCategory.set(category, [...(byCategory.get(category) ?? []), row.id]);
  }
  for (const [category, ids] of byCategory) {
    await prisma.model3D.updateMany({ where: { id: { in: ids } }, data: { category } });
    changed += ids.length;
  }

  checked += rows.length;
  lastId = rows.at(-1).id;
}

console.log(`Tekshirildi: ${checked} · kategoriyasi o'zgardi: ${changed}`);
await prisma.$disconnect();
