-- The existing runtime grants already cover status, reviewerId, decidedAt and event append/read.
GRANT UPDATE ("title", "description") ON TABLE public."Request" TO workflow_runtime;
