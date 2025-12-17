import Link from "next/link";
import { getUser } from "@/lib/getUser";

export default async function ListDeskLink() {
  const user = await getUser();

  // If user is logged in, go to create listing page, otherwise go to sign up
  const href = user ? "/dashboard/owner/desks/new" : "/auth/sign-up";

  return (
    <Link
      href={href}
      className="text-sm font-semibold text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-full transition hidden md:block"
    >
      List your desk
    </Link>
  );
}
