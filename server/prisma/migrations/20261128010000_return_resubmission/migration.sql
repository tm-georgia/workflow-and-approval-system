ALTER TYPE "RequestStatus" ADD VALUE 'RETURNED';
ALTER TYPE "ReviewAction" ADD VALUE 'RETURNED';
ALTER TYPE "ReviewAction" ADD VALUE 'RESUBMITTED';

ALTER TABLE "ReviewEvent"
    ALTER COLUMN "reason" DROP NOT NULL,
    ADD CONSTRAINT "ReviewEvent_action_reason_check" CHECK (
        CASE WHEN "action"::text = 'RESUBMITTED' THEN "reason" IS NULL
             ELSE "reason" IS NOT NULL AND "reason" ~ '[^[:space:]]'
        END
    );
