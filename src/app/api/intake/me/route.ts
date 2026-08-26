import { currentUser } from "@/lib/intake/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await currentUser();
  if (!user) return Response.json({ signedIn: false }, { status: 200 });
  return Response.json({
    signedIn: true,
    email: user.email,
    name: user.name || "",
    picture: user.picture || "",
  });
}
