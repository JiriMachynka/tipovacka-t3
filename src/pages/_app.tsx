import { type AppType } from "next/app";
import { api } from "~/utils/api";
import "~/styles/globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Head from "next/head";
import { Toaster } from "@/components/ui/toaster";

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <ClerkProvider {...pageProps}>
      <Head>
        <title>Tipovačka</title>
        <meta name="description" content="Tipovačka" />
        <link rel="icon" href="/favicons/tipovacka-logo.ico" />
      </Head>
      <Component {...pageProps} />
      <Toaster />
    </ClerkProvider>
  ) 
};

export default api.withTRPC(MyApp);
