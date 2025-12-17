import Link from "next/link";
import { getUser } from "@/lib/getUser";

export default async function ListDeskButton() {
  const user = await getUser();

  // If user is logged in, go to create listing page, otherwise go to sign up with redirect
  const href = user ? "/dashboard/owner/desks/new" : "/auth/sign-up?redirect=/dashboard/owner";

  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 px-8 py-3 text-base font-semibold text-white shadow-sm hover:from-pink-600 hover:to-rose-600 transition"
    >
      List your desk
    </Link>
  );
}
