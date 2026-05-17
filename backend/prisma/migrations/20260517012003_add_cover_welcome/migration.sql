-- AlterTable
ALTER TABLE "restaurants" ADD COLUMN     "coverUrl" TEXT,
ADD COLUMN     "showWelcome" BOOLEAN NOT NULL DEFAULT false;
