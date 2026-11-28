-- Run as the table and sequence owner after the ReviewEvent migration.
BEGIN;
GRANT SELECT, INSERT ON TABLE public."ReviewEvent" TO workflow_runtime;
GRANT USAGE ON SEQUENCE public."ReviewEvent_id_seq" TO workflow_runtime;
COMMIT;
