ALTER TABLE "restaurants"
  ADD COLUMN IF NOT EXISTS "emailVerificationToken"   TEXT,
  ADD COLUMN IF NOT EXISTS "emailVerificationExpires" TIMESTAMP(3);
