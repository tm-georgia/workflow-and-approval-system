export type Decision = "APPROVED" | "REJECTED";

export function parseRequestId(value: unknown): number | null {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) return null;
  const id = Number(value);
  return Number.isInteger(id) && id <= 2147483647 ? id : null;
}

export function isDecision(value: unknown): value is Decision {
  return value === "APPROVED" || value === "REJECTED";
}

export function mayReview(
  reviewerId: number,
  item: { requesterId: number; assignedReviewerId: number | null },
): boolean {
  return item.assignedReviewerId === reviewerId && item.requesterId !== reviewerId;
}
