CREATE TYPE "ReviewAction" AS ENUM ('REJECTED');

CREATE TABLE "ReviewEvent" (
    "id" SERIAL PRIMARY KEY,
    "requestId" INTEGER NOT NULL REFERENCES "Request"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "actorId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "action" "ReviewAction" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL CHECK (length("reason") > 0)
);

CREATE INDEX "ReviewEvent_requestId_occurredAt_id_idx"
    ON "ReviewEvent" ("requestId", "occurredAt", "id");
