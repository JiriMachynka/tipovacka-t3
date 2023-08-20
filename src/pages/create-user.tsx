import { api } from "~/utils/api";
import { useRouter } from "next/router"
import { useEffect } from "react";

export default function CreateUser() {
  const router = useRouter();

  const { data } = api.users.create.useQuery();
  // TODO: Make some fancy screen for user to show that he signed up 🔥
  useEffect(() => void router.push("/"), []);

  return null;
}