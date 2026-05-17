-- AlterTable
ALTER TABLE "restaurants" ADD COLUMN     "address" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "tagline" TEXT,
ADD COLUMN     "theme" TEXT NOT NULL DEFAULT 'beach',
ADD COLUMN     "wifiInfo" TEXT,
ADD COLUMN     "workingHours" TEXT;
