import { type NextPage } from "next";
import Navigation from "@/components/Navigation";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/router";
import { useEffect } from "react";

const Home: NextPage = () => {
  const user = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user.isSignedIn) void router.push("/");
  }, []);

  return (
    <main className="flex min-h-screen bg-primary">
      <Navigation />
    </main>
  );
};

export default Home;
