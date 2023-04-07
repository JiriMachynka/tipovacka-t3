import { type NextPage } from "next";
import Head from "next/head";

import { api } from "~/utils/api";
import Navigation from "@/components/Navigation";

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Tipovačka</title>
        <meta name="description" content="Tipovačka" />
        <link rel="icon" href="/favicons/tipovacka-logo.ico" />
      </Head>
      <main className="flex min-h-screen bg-[#11132b]">
        <Navigation />
      </main>
    </>
  );
};

export default Home;
