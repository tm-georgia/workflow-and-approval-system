import { expect, test } from "vitest";

// Intentional R-06 / C-02 demonstration. DO NOT MERGE.
test("C-02: deliberately failing test must block merging", () => {
expect(1).toBe(2);
});
