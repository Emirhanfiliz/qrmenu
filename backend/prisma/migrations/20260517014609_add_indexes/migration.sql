-- DropIndex
DROP INDEX "menu_scans_restaurantId_idx";

-- CreateIndex
CREATE INDEX "announcements_restaurantId_idx" ON "announcements"("restaurantId");

-- CreateIndex
CREATE INDEX "categories_restaurantId_idx" ON "categories"("restaurantId");

-- CreateIndex
CREATE INDEX "menu_scans_restaurantId_scannedAt_idx" ON "menu_scans"("restaurantId", "scannedAt");

-- CreateIndex
CREATE INDEX "products_categoryId_idx" ON "products"("categoryId");
