import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createStore, type IntakeStore } from "@/lib/intake/store";
import {
  cookieJar,
  ctx,
  jsonRequest,
  malformedJsonRequest,
  signIn,
  signOut,
} from "@/lib/intake/__tests__/helpers";

vi.mock("next/headers", () => import("@/lib/intake/__tests__/next-headers-mock"));

// One in-memory store per test, injected in place of the on-disk singleton.
let store: IntakeStore;
vi.mock("@/lib/intake/store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/intake/store")>();
  return { ...actual, getStore: () => store };
});

const { GET: listPosts, POST: createPost } = await import("./route");
const {
  GET: getPost,
  PATCH: patchPost,
  DELETE: deletePost,
} = await import("./[id]/route");

const ALICE = "alice@uw.edu";
const BOB = "bob@uw.edu";
const URL_POSTS = "https://seal.test/api/intake/posts";

beforeEach(() => {
  store = createStore(":memory:");
  cookieJar.clear();
  delete process.env.INTAKE_ADMIN_EMAILS;
});

afterEach(() => {
  store.close();
});

const seed = (title: string, author: string, extra: Record<string, unknown> = {}) =>
  store.create({ title, summary: "", body: "", bannerUrl: "", status: "draft", ...extra } as never, {
    email: author,
  });

describe("auth is required", () => {
  it.each([
    ["GET /posts", () => listPosts()],
    ["POST /posts", () => createPost(jsonRequest(URL_POSTS, "POST", { title: "x" }))],
    ["GET /posts/1", () => getPost(jsonRequest(`${URL_POSTS}/1`, "GET"), ctx(1))],
    ["PATCH /posts/1", () => patchPost(jsonRequest(`${URL_POSTS}/1`, "PATCH", { title: "x" }), ctx(1))],
    ["DELETE /posts/1", () => deletePost(jsonRequest(`${URL_POSTS}/1`, "DELETE"), ctx(1))],
  ])("%s returns 401 when signed out", async (_label, call) => {
    signOut();
    expect((await call()).status).toBe(401);
  });

  it("rejects a forged session cookie", async () => {
    cookieJar.set("seal_intake_session", "forged.signature");
    expect((await listPosts()).status).toBe(401);
  });
});

describe("POST /api/intake/posts", () => {
  beforeEach(() => signIn(ALICE));

  it("creates a post and returns 201", async () => {
    const response = await createPost(
      jsonRequest(URL_POSTS, "POST", { title: "My Update", body: "<p>hi</p>" }),
    );
    expect(response.status).toBe(201);

    const { post } = await response.json();
    expect(post).toMatchObject({ title: "My Update", slug: "my-update", status: "draft" });
    expect(store.get(post.id)).not.toBeNull();
  });

  it("attributes the post to the signed-in user, ignoring any author in the body", async () => {
    const response = await createPost(
      jsonRequest(URL_POSTS, "POST", { title: "T", authorEmail: BOB }),
    );
    const { post } = await response.json();
    expect(post.authorEmail).toBe(ALICE);
  });

  it("sanitizes the stored body", async () => {
    const response = await createPost(
      jsonRequest(URL_POSTS, "POST", { title: "T", body: '<p>ok</p><script>alert(1)</script>' }),
    );
    const { post } = await response.json();
    expect(post.body).not.toContain("script");
  });

  it("returns 422 for a missing title", async () => {
    const response = await createPost(jsonRequest(URL_POSTS, "POST", { title: "" }));
    expect(response.status).toBe(422);
    expect((await response.json()).error).toMatch(/title is required/i);
  });

  it("returns 422 for a remote banner URL", async () => {
    const response = await createPost(
      jsonRequest(URL_POSTS, "POST", { title: "T", bannerUrl: "https://evil.com/x.png" }),
    );
    expect(response.status).toBe(422);
  });

  it("returns 400 for a malformed JSON body", async () => {
    expect((await createPost(malformedJsonRequest(URL_POSTS, "POST"))).status).toBe(400);
  });
});

describe("GET /api/intake/posts", () => {
  it("lists only the signed-in member's posts", async () => {
    seed("Alice A", ALICE);
    seed("Alice B", ALICE);
    seed("Bob A", BOB);

    signIn(ALICE);
    const { posts } = await (await listPosts()).json();

    expect(posts).toHaveLength(2);
    expect(posts.map((p: { title: string }) => p.title).sort()).toEqual(["Alice A", "Alice B"]);
  });
});

describe("ownership isolation on /api/intake/posts/[id]", () => {
  it("hides another member's post as 404 rather than 403", async () => {
    const bobsPost = seed("Bob's Draft", BOB);
    signIn(ALICE);

    const response = await getPost(jsonRequest(`${URL_POSTS}/${bobsPost.id}`, "GET"), ctx(bobsPost.id));
    expect(response.status).toBe(404);
    // The title must not leak in the error body.
    expect(JSON.stringify(await response.json())).not.toContain("Bob's Draft");
  });

  it("refuses to patch another member's post and leaves it untouched", async () => {
    const bobsPost = seed("Bob's Draft", BOB);
    signIn(ALICE);

    const response = await patchPost(
      jsonRequest(`${URL_POSTS}/${bobsPost.id}`, "PATCH", { title: "Hijacked" }),
      ctx(bobsPost.id),
    );

    expect(response.status).toBe(404);
    expect(store.get(bobsPost.id)!.title).toBe("Bob's Draft");
  });

  it("refuses to delete another member's post and leaves it in place", async () => {
    const bobsPost = seed("Bob's Draft", BOB);
    signIn(ALICE);

    const response = await deletePost(jsonRequest(`${URL_POSTS}/${bobsPost.id}`, "DELETE"), ctx(bobsPost.id));

    expect(response.status).toBe(404);
    expect(store.get(bobsPost.id)).not.toBeNull();
  });

  it("lets an admin reach another member's post", async () => {
    process.env.INTAKE_ADMIN_EMAILS = ALICE;
    const bobsPost = seed("Bob's Draft", BOB);
    signIn(ALICE);

    const response = await getPost(jsonRequest(`${URL_POSTS}/${bobsPost.id}`, "GET"), ctx(bobsPost.id));
    expect(response.status).toBe(200);
    expect((await response.json()).post.title).toBe("Bob's Draft");
  });

  it("matches ownership case-insensitively", async () => {
    const post = seed("Mine", ALICE);
    signIn("ALICE@UW.EDU");

    expect((await getPost(jsonRequest(`${URL_POSTS}/${post.id}`, "GET"), ctx(post.id))).status).toBe(200);
  });
});

describe("PATCH / DELETE on your own post", () => {
  beforeEach(() => signIn(ALICE));

  it("updates fields", async () => {
    const post = seed("Before", ALICE);
    const response = await patchPost(
      jsonRequest(`${URL_POSTS}/${post.id}`, "PATCH", { title: "After", status: "published" }),
      ctx(post.id),
    );

    expect(response.status).toBe(200);
    const updated = (await response.json()).post;
    expect(updated).toMatchObject({ title: "After", status: "published", slug: "after" });
  });

  it("returns 422 for an invalid patch", async () => {
    const post = seed("T", ALICE);
    const response = await patchPost(
      jsonRequest(`${URL_POSTS}/${post.id}`, "PATCH", { status: "archived" }),
      ctx(post.id),
    );
    expect(response.status).toBe(422);
  });

  it("deletes", async () => {
    const post = seed("Doomed", ALICE);
    const response = await deletePost(jsonRequest(`${URL_POSTS}/${post.id}`, "DELETE"), ctx(post.id));

    expect(response.status).toBe(200);
    expect(store.get(post.id)).toBeNull();
  });
});

describe("id parsing", () => {
  beforeEach(() => signIn(ALICE));

  it.each(["abc", "0", "-1", "1.5", "", "1; DROP TABLE posts"])(
    "treats %s as not found",
    async (id) => {
      const response = await getPost(jsonRequest(`${URL_POSTS}/${id}`, "GET"), ctx(id));
      expect(response.status).toBe(404);
    },
  );

  it("returns 404 for a well-formed but unknown id", async () => {
    expect((await getPost(jsonRequest(`${URL_POSTS}/9999`, "GET"), ctx(9999))).status).toBe(404);
  });
});
