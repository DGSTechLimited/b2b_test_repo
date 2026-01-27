-- Users module enhancements
ALTER TYPE "UserStatus" RENAME VALUE 'DISABLED' TO 'INACTIVE';

ALTER TABLE "User" RENAME COLUMN "passwordHash" TO "password_hash";
ALTER TABLE "User" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "User" RENAME COLUMN "updatedAt" TO "updated_at";

ALTER TABLE "User" ADD COLUMN "name" TEXT;
ALTER TABLE "User" ADD COLUMN "created_by_user_id" UUID;
ALTER TABLE "User" ADD COLUMN "last_login_at" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "must_change_password" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "password_updated_at" TIMESTAMP(3);

UPDATE "User" SET "name" = COALESCE("email", 'User') WHERE "name" IS NULL;
ALTER TABLE "User" ALTER COLUMN "name" SET NOT NULL;

UPDATE "User" SET "must_change_password" = false WHERE "role" = 'ADMIN';

UPDATE "User"
SET "created_by_user_id" = (
  SELECT "id" FROM "User" WHERE "role" = 'ADMIN' ORDER BY "created_at" ASC LIMIT 1
)
WHERE "created_by_user_id" IS NULL AND "role" = 'DEALER';

ALTER TABLE "User"
  ADD CONSTRAINT "User_created_by_user_id_fkey"
  FOREIGN KEY ("created_by_user_id") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "User_role_status_idx" ON "User"("role", "status");

ALTER TABLE "DealerProfile" RENAME COLUMN "userId" TO "user_id";
ALTER TABLE "DealerProfile" RENAME COLUMN "accountNo" TO "account_no";
ALTER TABLE "DealerProfile" RENAME COLUMN "name" TO "dealer_name";
ALTER TABLE "DealerProfile" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "DealerProfile" RENAME COLUMN "updatedAt" TO "updated_at";

ALTER TABLE "DealerProfile" ADD COLUMN "dispatch_method_default" TEXT;

ALTER TABLE "DealerProfile" DROP CONSTRAINT IF EXISTS "DealerProfile_userId_fkey";
ALTER TABLE "DealerProfile" ADD CONSTRAINT "DealerProfile_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "DealerProfile_account_no_idx" ON "DealerProfile"("account_no");

UPDATE "User"
SET "name" = "DealerProfile"."dealer_name"
FROM "DealerProfile"
WHERE "User"."role" = 'DEALER' AND "DealerProfile"."user_id" = "User"."id";
