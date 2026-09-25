import { prisma } from '../src/database/connection.js';
import { createModel } from '../src/models/Model3D.js';
import { getImageEmbedding } from '../src/services/embeddingService.js';
import { DEMO_MODELS, DEMO_IMAGE_URLS } from '../src/config/demoModels.js';

async function main() {
  const realModels = await prisma.model3D.count({ where: { telegramMessageId: { not: null } } });
  if (realModels > 0) {
    console.log(`Bazada ${realModels} ta haqiqiy model bor — namunaviy ma'lumot qo'shilmadi.`);
    return;
  }

  await prisma.model3D.deleteMany({ where: { previewImageUrl: { in: DEMO_IMAGE_URLS } } });
  console.log("Namunaviy modellar qo'shilmoqda...");
  for (const model of DEMO_MODELS) {
    const embedding = await getImageEmbedding(model.previewImageUrl);
    await createModel({ ...model, sourceLink: null, embedding });
    console.log(`  ✓ ${model.name}`);
  }
  console.log('Tayyor!');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
