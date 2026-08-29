import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/intake/auth";
import { getStore } from "@/lib/intake/store";
import { SignOutButton } from "./SignOutButton";
import { SECTION_LABELS } from "@/lib/intake/sections";

export const dynamic = "force-dynamic";

const formatDate = (ms: number) =>
  new Date(ms).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

export default async function IntakeDashboard() {
  const user = await currentUser();
  if (!user) redirect("/intake/login?return=%2Fintake");

  const posts = getStore().listByAuthor(user.email);

  return (
    <div className="page-shell">
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Intake</h1>
          <p className="page-subtitle">
            Signed in as {user.name || user.email}. Drafts are private to you until you publish them.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-8">
          <Link href="/intake/new" className="action-chip">
            <span>New post</span>
            <span aria-hidden="true">+</span>
          </Link>
          <SignOutButton />
        </div>

        {posts.length === 0 ? (
          <div className="surface-card p-8 text-center">
            <p className="text-[#f1f3f9] font-semibold mb-2">Nothing here yet</p>
            <p className="text-slate-400 text-sm">
              Create your first post — you can save it as a draft and come back to it.
            </p>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <li key={post.id}>
                <Link
                  href={`/intake/edit/${post.id}`}
                  className="surface-card surface-card-hover flex flex-col overflow-hidden h-full"
                >
                  {post.bannerUrl ? (
                    <div className="media-frame h-36 shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={post.bannerUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : null}
                  <div className="flex flex-col flex-1 p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`text-[0.68rem] font-semibold uppercase tracking-widest ${
                          post.status === "published" ? "text-[#e0b563]" : "text-slate-500"
                        }`}
                      >
                        {post.status}
                      </span>
                      <span className="text-xs text-slate-600">·</span>
                      <span className="text-xs text-slate-500">
                        {SECTION_LABELS[post.section] ?? post.section}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mb-2">{formatDate(post.updatedAt)}</p>
                    <h2 className="text-[#f1f3f9] font-semibold leading-snug mb-2">{post.title}</h2>
                    {post.summary ? (
                      <p className="text-slate-400 text-sm leading-relaxed line-clamp-3">
                        {post.summary}
                      </p>
                    ) : null}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
