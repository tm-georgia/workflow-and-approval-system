import { describe, expect, it } from "vitest";
import { isDecision, mayReview, parseRequestId } from "../src/reviewer-rules";

describe("F-03 boundary and authorization rules", () => {
  it("TEST-F03-UNIT-01: assignment never permits self-approval or an unassigned record", () => {
    expect(mayReview(7, { requesterId: 7, assignedReviewerId: 7 })).toBe(false);
    expect(mayReview(7, { requesterId: 8, assignedReviewerId: null })).toBe(false);
    expect(mayReview(7, { requesterId: 8, assignedReviewerId: 9 })).toBe(false);
    expect(mayReview(7, { requesterId: 8, assignedReviewerId: 7 })).toBe(true);
  });
  it("TEST-F03-UNIT-02: PostgreSQL integer boundaries and canonical IDs are enforced", () => {
    expect(parseRequestId("1")).toBe(1);
    expect(parseRequestId("2147483647")).toBe(2147483647);
    for (const id of ["2147483648", "999999999999999999999", "0", "-1", "01", "1.5", "1e2", " 1", "1 ", "", ["1"], null]) {
      expect(parseRequestId(id)).toBeNull();
    }
  });
  it("TEST-F03-UNIT-03: only final Sprint 1 decisions are permitted", () => {
    expect(isDecision("APPROVED")).toBe(true);
    expect(isDecision("REJECTED")).toBe(true);
    for (const decision of [undefined, null, {}, ["APPROVED"], "approved", "PENDING", "RETURNED", ""]) expect(isDecision(decision)).toBe(false);
  });
});
