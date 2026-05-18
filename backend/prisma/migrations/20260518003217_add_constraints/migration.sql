-- Products: fiyat kuralları
ALTER TABLE products
  ADD CONSTRAINT chk_price_positive CHECK (price > 0),
  ADD CONSTRAINT chk_discounted_positive CHECK ("discountedPrice" IS NULL OR "discountedPrice" > 0),
  ADD CONSTRAINT chk_discounted_less_than_price CHECK ("discountedPrice" IS NULL OR "discountedPrice" < price),
  ADD CONSTRAINT chk_prep_time_positive CHECK ("preparationTime" IS NULL OR "preparationTime" > 0),
  ADD CONSTRAINT chk_calories_positive CHECK (calories IS NULL OR calories > 0),
  ADD CONSTRAINT chk_product_order_positive CHECK ("order" >= 0);

-- Categories: sıralama negatif olamaz
ALTER TABLE categories
  ADD CONSTRAINT chk_category_order_positive CHECK ("order" >= 0);

-- Subscriptions: bitiş tarihi başlangıçtan sonra olmalı
ALTER TABLE subscriptions
  ADD CONSTRAINT chk_subscription_dates CHECK ("endsAt" > "startsAt");

-- Restaurants: slug sadece küçük harf, rakam, tire
ALTER TABLE restaurants
  ADD CONSTRAINT chk_slug_format CHECK (slug ~ '^[a-z0-9-]+$');