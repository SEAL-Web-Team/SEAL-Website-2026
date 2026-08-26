// Stand-in for next/headers in route-handler tests. Test files wire it up with:
//   vi.mock("next/headers", () => import("@/lib/intake/__tests__/next-headers-mock"));
// Keeping the module self-contained lets that call sit at the top level, which
// is where vitest requires vi.mock to be.

export const cookieJar = new Map<string, string>();

export async function cookies() {
  return {
    get(name: string) {
      const value = cookieJar.get(name);
      return value === undefined ? undefined : { name, value };
    },
  };
}
