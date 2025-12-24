import { getUser } from "@/lib/getUser";
import UserMenuClient from "./UserMenuClient";

type UserMenuWrapperProps = {
  hideRoleSwitch?: boolean;
  hideDashboard?: boolean;
};

export default async function UserMenuWrapper({
  hideRoleSwitch = false,
  hideDashboard = false
}: UserMenuWrapperProps = {}) {
  const user = await getUser();
  return (
    <UserMenuClient
      initialUser={user}
      hideRoleSwitch={hideRoleSwitch}
      hideDashboard={hideDashboard}
    />
  );
}
