import { redirect } from "next/navigation";

export default async function DealersPage() {
  redirect("/admin/users");
}
