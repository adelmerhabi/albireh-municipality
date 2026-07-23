import { getAdminIdentity } from "../../../lib/admin-auth";
import { getAdminResidentRequests } from "../../../lib/requests";

export async function GET() {
  const identity = await getAdminIdentity();
  if (!identity) {
    return Response.json({ error: "غير مصرح" }, { status: 401 });
  }
  return Response.json({ requests: await getAdminResidentRequests() });
}
