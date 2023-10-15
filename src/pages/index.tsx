import { ChevronRight } from "lucide-react";
import { api } from "@/utils/api";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import Link from "next/link";
import Loading from "@/components/Loading";
import { useUser } from "@clerk/nextjs";

const Home = () => {
	const user = useUser();
	const { isLoading, data: allTournaments } = api.tournament.getAllTournaments.useQuery();

	return (
		<main className="flex flex-col min-h-screen bg-primary">
			<Navigation />
			{user.isSignedIn && isLoading ? <Loading /> : (
				<section className="w-full lg:max-w-screen-lg lg:mx-auto">
					{allTournaments?.map((tournament) => (
						<Link key={tournament.id} href={`/tournaments/${tournament.id}`} legacyBehavior>
							<Button className="flex items-center justify-between w-full p-5 my-2 text-xl rounded-lg text-slate-50 py-10 group bg-gradient-to-r from-slate-900 to-slate-800 hover:text-slate-50 border-2 border-slate-50 transition-all duration-700">
								<span>{tournament.name}</span>
								<div className="mr-5 group-hover:mr-0 transition-all ease-in-out duration-300">
									<ChevronRight size={24} />
								</div>
							</Button>
						</Link>
					))}
				</section>
			)}
			{user.isSignedIn && (
				<Link href="/tournaments/create" className="w-fit m-auto">
					<Button className="text-2xl py-7">Vytvořit tipovačku</Button>
				</Link>
			)}
		</main>
	);
};

export default Home;
