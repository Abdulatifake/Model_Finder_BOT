-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "telegramId" BIGINT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "username" TEXT,
    "phone" TEXT,
    "language" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Model3D" (
    "id" SERIAL NOT NULL,
    "telegramMessageId" BIGINT,
    "externalId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'other',
    "tags" TEXT[],
    "previewImageUrl" TEXT NOT NULL,
    "sourceLink" TEXT,
    "telegramLink" TEXT,
    "fileMessageIds" BIGINT[],
    "fileNames" TEXT[],
    "fileSize" BIGINT,
    "photoFileId" TEXT,
    "embedding" halfvec(512),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Model3D_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchQuery" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "imageUrl" TEXT,
    "queryText" TEXT,
    "objects" JSONB,
    "objectIndex" INTEGER,
    "parentId" INTEGER,
    "sourceModelId" INTEGER,
    "resultIds" INTEGER[],
    "resultScores" DOUBLE PRECISION[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchQuery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "modelId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");

-- CreateIndex
CREATE UNIQUE INDEX "Model3D_telegramMessageId_key" ON "Model3D"("telegramMessageId");

-- CreateIndex
CREATE INDEX "Model3D_category_idx" ON "Model3D"("category");

-- CreateIndex
CREATE INDEX "Model3D_externalId_idx" ON "Model3D"("externalId");

-- CreateIndex
CREATE INDEX "SearchQuery_userId_createdAt_idx" ON "SearchQuery"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SearchQuery_parentId_idx" ON "SearchQuery"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_modelId_key" ON "Favorite"("userId", "modelId");

-- AddForeignKey
ALTER TABLE "SearchQuery" ADD CONSTRAINT "SearchQuery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model3D"("id") ON DELETE CASCADE ON UPDATE CASCADE;
