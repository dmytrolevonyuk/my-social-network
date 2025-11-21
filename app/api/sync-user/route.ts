import { syncUser } from "@/actions/user.action";

export async function GET() {
  try {
    await syncUser();
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false }, { status: 500 });
  }
}
