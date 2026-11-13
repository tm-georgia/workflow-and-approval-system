# Part D — Three-Sprint Plan

**Baseline decision recorded 13 November 2026:** the team uses one assigned Reviewer and one approval stage for departmental purchase requests. Reasons and extended history, return/resubmission, filtering, and reporting are part of the whole-product scope and are allocated below. F-01 through F-03 remain Sprint 1. This plan distinguishes the implemented Sprint 1 increment from future work.

## Sprint allocation

| Sprint | Goal and features | Dependencies | Completion outcome |
|---|---|---|---|
| **Sprint 1 — Deliverable 1** | F-01 authentication/current identity; F-02 requester submission and own-status retrieval; F-03 assigned Reviewer queue and approve/reject with persisted status, Reviewer identity, and time. | PostgreSQL, Prisma migrations, seeded accounts; F-02/F-03 depend on F-01. F-03 also depends on the server-owned assignment rule in F-02. | A working UI → API → database journey; login/logout; two roles; ownership/assignment/self-approval/pending-only enforcement; automated tests and local setup. Code and tests are on sprint-staging; an accepted main release remains a separate integration gate. |
| **Sprint 2 — Deliverable 2** | F-04 decision reasons and ordered history; F-05 return for changes and owner resubmission. | Accepted Sprint 1 baseline; F-05 depends on F-04 history; each feature gets a contract, AC, STS, and DoD before implementation. Lab 5 supplies deployment/CI foundations; Lab 6 defects may inform fixes. | Complete, reviewed, integrated, tested Sprint 2 workflows and regression checks; retain a versioned release and deployed integrated candidate by 29 November. |
| **Sprint 3 — Deliverable 2 progress and Final Delivery** | F-06 filtering of authorized requests; F-07 decision summaries/reporting; integration and product hardening. | F-06 depends on authorized request lists and F-05 states; F-07 depends on F-04/F-05 history. Lab 7 maintenance findings are tracked as separate changes. | By 29 November, complete contracts and demonstrate at least one meaningful implemented/tested Sprint 3 workflow or rule with remaining work listed. By 13 December, finish the agreed product, verify it, and release the complete deployed product. |

## Scope decisions

- **Reviewer assignment:** one server-designated seeded Reviewer is assigned to every new request in the selected department scope. The API enforces assignment; users cannot select or spoof it.
- **Approval stages:** one Reviewer decision is the complete chain for this bounded context. Additional stages are not in the agreed baseline.
- **Editing:** a Requester cannot edit a pending request. In Sprint 2, the Reviewer may return a request with a reason; its owner may then revise and resubmit it. Previous events remain recorded.
- **Reasons/history:** Sprint 1 records status, deciding Reviewer, and decision time. Sprint 2 adds reasons and ordered review events, including returns/resubmissions. This schedules the Theme 5 reason/history capability without misrepresenting it as already implemented.

## Team workflow and checkpoints

Both students participate in requirements/design decisions, implementation, tests, review, and release; file ownership is a temporary work split, not permanent roles. For each feature, create/link an Issue, branch from sprint-staging, write/version the contract before implementation, open a PR to sprint-staging, and have the teammate provide a substantive review. Run integration and acceptance checks before a reviewed sprint-staging-to-main release PR.

Deliverable 2 is due 29 November and requires completed Sprint 2 plus tested Sprint 3 progress. Lab 5 deployment/CI work and Lab 6/7 evidence follow their course instructions; Docker, CI/CD, and GCP are not Deliverable 1 implementation requirements. The final product is due 13 December.

## Current status

F-01, F-02, and F-03 are implemented and locally verified in the available sprint-staging history. Their verification report records the tested version and results; verify again on the eventual release commit. F-04 through F-07 are planned future work and are not claimed as implemented.
