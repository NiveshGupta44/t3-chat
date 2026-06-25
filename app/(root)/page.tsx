import UserButton from "@/modules/authentication/components/user-button";
import { currentUser } from "@/modules/authentication/actions";

export default async function Home() {
  const user = await currentUser();

  return (
    <div className="flex flex-1 items-center justify-center">
      <UserButton user={user} />
    </div>
  );
}