-- AlterTable
ALTER TABLE "announcements" ADD COLUMN     "imageUrl" TEXT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "allergens" TEXT,
ADD COLUMN     "calories" INTEGER,
ADD COLUMN     "discountedPrice" DECIMAL(10,2),
ADD COLUMN     "preparationTime" INTEGER;
