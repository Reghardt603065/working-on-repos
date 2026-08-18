CREATE TABLE "CertificationListing" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "category" TEXT,
    "level" TEXT,
    "duration" TEXT,
    "cost" TEXT,
    "isFree" BOOLEAN NOT NULL DEFAULT false,
    "certificateType" TEXT,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lastVerified" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CertificationListing_pkey"
        PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CertificationListing_source_externalId_key"
    ON "CertificationListing"("source", "externalId");

CREATE INDEX "CertificationListing_provider_idx"
    ON "CertificationListing"("provider");

CREATE INDEX "CertificationListing_isFree_idx"
    ON "CertificationListing"("isFree");

CREATE INDEX "CertificationListing_category_idx"
    ON "CertificationListing"("category");