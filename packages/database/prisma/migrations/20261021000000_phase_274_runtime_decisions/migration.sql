CREATE TABLE "RuntimeDecisionRecord" (
  "decisionId" VARCHAR(128) NOT NULL,
  "runtimeId" VARCHAR(128) NOT NULL,
  "correlationId" VARCHAR(256) NOT NULL,
  "outcome" VARCHAR(32) NOT NULL,
  "record" JSONB NOT NULL,
  "ownerScopeKey" VARCHAR(384),
  "recordedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RuntimeDecisionRecord_pkey" PRIMARY KEY ("decisionId")
);

CREATE INDEX "RuntimeDecisionRecord_ownerScopeKey_recordedAt_idx"
  ON "RuntimeDecisionRecord" ("ownerScopeKey", "recordedAt");
CREATE INDEX "RuntimeDecisionRecord_correlationId_idx"
  ON "RuntimeDecisionRecord" ("correlationId");
