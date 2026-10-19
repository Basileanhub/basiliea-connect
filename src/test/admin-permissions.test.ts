import { describe, expect, it } from "vitest";
import { allowed, canManageAdmins, defaultPreacher } from "@/lib/cms-model";

describe("Studio permissions", () => {
  it("lets super administrators open every module", () => {
    expect(allowed("super_admin", [], "sermons")).toBe(true);
  });
  it("limits editors to the modules they were given", () => {
    expect(allowed("editor", ["events"], "events")).toBe(true);
    expect(allowed("editor", ["events"], "sermons")).toBe(false);
  });
  it("only super administrators manage other admins", () => {
    expect(canManageAdmins("super_admin")).toBe(true);
    expect(canManageAdmins("editor")).toBe(false);
  });
  it("defaults the preacher to Apostle Gabriel Idogbe", () => {
    expect(defaultPreacher).toBe("Apostle Gabriel Idogbe");
  });
});
