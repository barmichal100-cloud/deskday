import { getUser } from "@/lib/getUser";
import UserMenuClient from "./UserMenuClient";

export default async function UserMenuWrapper() {
  const user = await getUser();
  return <UserMenuClient initialUser={user} />;
}
