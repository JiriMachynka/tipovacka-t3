import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useUser, SignInButton, SignOutButton } from "@clerk/nextjs";

import { api } from "~/utils/api";

const Home: NextPage = () => {
  const user = useUser();
  return (
    <>
      <Head>
        <title>Tipovačka</title>
        <meta name="description" content="Tipovačka" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
        {!user.isSignedIn ? <SignInButton /> : <SignOutButton />}
      </main>
    </>
  );
};

export default Home;
