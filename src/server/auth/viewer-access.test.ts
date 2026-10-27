import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { requireServerFunctionAccess } from "./viewer-access";

// Every exported server function, as TanStack Start's serverFnMeta names it.
const serverFunctions = readdirSync("src/serverFunctions")
  .filter((file) => file.endsWith(".ts") && !file.endsWith(".test.ts"))
  .flatMap((file) => {
    const filename = `src/serverFunctions/${file}`;
    const source = readFileSync(filename, "utf8");
    return [...source.matchAll(/export const (\w+) = createServerFn\(/g)].map(
      ([, name]) => ({ filename, name }),
    );
  });

function viewerCanCall(serverFn: { filename: string; name: string }) {
  try {
    requireServerFunctionAccess("viewer", serverFn);
    return true;
  } catch {
    return false;
  }
}

describe("viewer server function access", () => {
  it("lets viewers read dashboards and refuses paid research", () => {
    expect(
      viewerCanCall({
        filename: "src/serverFunctions/dashboard.ts",
        name: "getDashboardOverview",
      }),
    ).toBe(true);
    expect(
      viewerCanCall({
        filename: "src/serverFunctions/keywords.ts",
        name: "researchKeywords",
      }),
    ).toBe(false);
  });

  it("refuses viewers when the function metadata is missing", () => {
    expect(() => requireServerFunctionAccess("viewer", undefined)).toThrow();
  });

  it("does not restrict roles that can edit", () => {
    for (const role of ["owner", "admin", "member", "admin,viewer"]) {
      expect(() =>
        requireServerFunctionAccess(role, {
          filename: "src/serverFunctions/keywords.ts",
          name: "researchKeywords",
        }),
      ).not.toThrow();
    }
  });

  // Catches a write or paid call being added to the viewer allowlist. The
  // count equals the allowlist's length, so an entry whose function was
  // renamed or removed upstream fails here too; update it with the list.
  it("only opens reads and the viewer's own preferences", () => {
    const opened = serverFunctions.filter(viewerCanCall).map((fn) => fn.name);
    const ownPreferences = [
      "saveOnboardingAnswers",
      "dismissGscNudge",
      "setProductUpdatesOptIn",
      "switchOrganization",
      "acceptTermsUpdate",
    ];
    expect(
      opened.filter(
        (name) =>
          !/^(get|list|export)[A-Z]/.test(name) &&
          !ownPreferences.includes(name),
      ),
    ).toEqual([]);
    expect(opened).toHaveLength(64);
  });
});
