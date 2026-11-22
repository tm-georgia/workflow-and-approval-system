import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ReleaseBadge from "./ReleaseBadge";
import { releaseSha } from "./release";

describe("release evidence", () => {
  it("shows the visible Lab 5 change without requiring login", () => {
    render(<ReleaseBadge />);
    expect(screen.getByRole("contentinfo")).toHaveTextContent("Lab 5: automated deployment");
    expect(screen.getByTitle("development")).toHaveTextContent("development");
  });

  it("accepts only a full commit SHA or the local development marker", () => {
    const sha = "a".repeat(40);
    expect(releaseSha(sha)).toBe(sha);
    expect(releaseSha(undefined)).toBe("development");
    expect(releaseSha("development")).toBe("development");
    for (const value of ["", "abc123", "A".repeat(40), "release\nvalue", "<script>"]) {
      expect(() => releaseSha(value)).toThrow("Use a full lowercase Git commit SHA");
    }
  });
});
