import { type NextPage } from "next";
import Navigation from "@/components/Navigation";

const Home: NextPage = () => {
  return (
    <main className="flex min-h-screen bg-[#11132b]">
      <Navigation />
    </main>
  );
};

export default Home;
