-- Additive: existing requests remain unassigned. No records are backfilled/deleted.
ALTER TABLE "Request" ADD COLUMN "assignedReviewerId" INTEGER;

CREATE INDEX "Request_assignedReviewerId_status_createdAt_id_idx"
    ON "Request"("assignedReviewerId", "status", "createdAt", "id");

ALTER TABLE "Request" ADD CONSTRAINT "Request_assignedReviewerId_fkey"
    FOREIGN KEY ("assignedReviewerId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
