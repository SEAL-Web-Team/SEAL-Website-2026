import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAccessConfig } from "@/lib/intake/access-gate";
import { currentUser } from "@/lib/intake/auth";
import { getStore } from "@/lib/intake/store";
import { PostEditor } from "../../PostEditor";

export const dynamic = "force-dynamic";

export default async function EditIntakePost({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentUser();
  if (!user) redirect(`/intake/login?return=${encodeURIComponent(`/intake/edit/${id}`)}`);

  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) notFound();

  const post = getStore().get(numericId);
  // Someone else's post is reported as missing rather than forbidden, so drafts
  // can't be enumerated by walking IDs.
  if (!post) notFound();
  if (post.authorEmail !== user.email.toLowerCase() && !getAccessConfig().isAdmin(user.email)) {
    notFound();
  }

  return (
    <div className="page-shell">
      <div className="page-container">
        <div className="mb-6">
          <Link
            href="/intake"
            className="text-sm font-medium text-slate-500 transition-colors hover:text-[#f1f3f9]"
          >
            ← Back to Intake
          </Link>
        </div>
        <PostEditor
          initial={{
            id: post.id,
            section: post.section,
            title: post.title,
            summary: post.summary,
            body: post.body,
            bannerUrl: post.bannerUrl,
            fields: post.fields,
            status: post.status,
          }}
        />
      </div>
    </div>
  );
}
