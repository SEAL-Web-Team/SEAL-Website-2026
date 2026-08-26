import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/intake/auth";
import { PostEditor } from "../PostEditor";

export const dynamic = "force-dynamic";

export default async function NewIntakePost() {
  if (!(await currentUser())) redirect("/intake/login?return=%2Fintake%2Fnew");

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
            id: null,
            section: "news",
            title: "",
            summary: "",
            body: "",
            bannerUrl: "",
            fields: {},
            status: "draft",
          }}
        />
      </div>
    </div>
  );
}
