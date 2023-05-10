import Loading from "@/components/Loading";
import SingleTournamentLayout from "@/components/SingleTournamentLayout";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { type DeletedPlayer } from "@/types";
import { useAuth } from "@clerk/nextjs";
import { Formik } from "formik";
import { Trash } from "lucide-react";
import { type GetServerSidePropsContext } from "next";
import { useState } from "react";
import { api } from "~/utils/api";

export const MyTips = ({ id }: { id: string }) => {
	const { toast } = useToast();
	const { userId } = useAuth();
	const [deletedPlayer, setDeletedPlayer] = useState<DeletedPlayer>(null);
	const utils = api.useContext();
	const { isLoading, data: players } = api.tournament.getTournamentPlayers.useQuery({ tournamentId: parseInt(id) });

	const { mutate: addPlayer } = api.tournament.addPlayer.useMutation({
		onSuccess(data) {
      toast({
        title: "Přidán",
        description: `Uživatel ${data} byl přidán do tipovačky`,
      });
			void utils.tournament.invalidate();
    },
    onError() {
      toast({
        title: "Chyba",
        description: `Nepodařilo se přidat uživatele`,
      });
    }
	});
	const { mutate: deletePlayer } = api.tournament.deletePlayer.useMutation({
		onSuccess() {
      toast({
        title: "Odstraněn",
        description: `Uživatel ${deletedPlayer?.username as string} byl odstraněn z tipovačky`,
      });
			setDeletedPlayer(null);
			void utils.tournament.invalidate();
    },
    onError() {
      toast({
        title: "Chyba",
        description: `Nepodařilo se odstranit uživatele ${deletedPlayer?.username as string}`,
      });
			setDeletedPlayer(null);
    }
	});

	return (
		<SingleTournamentLayout>
			{isLoading ? <Loading /> : (
			<>
				{deletedPlayer && (
					<AlertDialog open={!!deletedPlayer}>
					<AlertDialogContent className="bg-primary">
						<Formik
							initialValues={{
								id: deletedPlayer.id,
								username: deletedPlayer?.username
							}}
							onSubmit={(values) => {
								const { id } = values;
								deletePlayer({
									id,
								});
							}}
						>
							{props => (
								<form onSubmit={props.handleSubmit}>
									<AlertDialogHeader>
											<AlertDialogTitle className="text-3xl text-slate-50 text-center">Odstranit hráče z tipovačky</AlertDialogTitle>
											<AlertDialogDescription className="flex flex-col gap-3 text-xl font-bold text-slate-50 text-center py-2" asChild>
												<div className="py-16">Opravdu chcete odstranit hráče {props.values.username}?</div>
											</AlertDialogDescription>
										</AlertDialogHeader>
										<AlertDialogFooter>
											<AlertDialogCancel className="bg-slate-100 text-black font-bold hover:bg-slate-300 text-lg" onClick={() => setDeletedPlayer(null)}>Zrušit</AlertDialogCancel>
											<AlertDialogAction asChild>
												<Button type="submit" className="text-lg bg-red-600 text-black font-bold hover:bg-red-500 focus:ring-red-600">
													Odstranit
												</Button>
											</AlertDialogAction>
										</AlertDialogFooter>
									</form>
								)}
							</Formik>
						</AlertDialogContent>
					</AlertDialog>
				)}
				<Formik
					initialValues={{
						username: "",
					}}
					onSubmit={(values, { resetForm }) => {
						const { username } = values;
						addPlayer({
							tournamentId: parseInt(id),
							username,
						});
						resetForm();
					}}
				>
					{props => (
						<form onSubmit={props.handleSubmit} className="flex mx-auto justify-center w-full lg:w-3/4">
							<div className="flex flex-col gap-3">
								<Label htmlFor="username" >Přezdívka hráče</Label>
								<div className="grid grid-cols-[1fr_auto] gap-3">
									<Input id="username" name="username" autoComplete="off" onChange={props.handleChange} onBlur={props.handleBlur} value={props.values.username} type="text" />
									<Button type="submit">Přidat hráče</Button>
								</div>
							</div>
						</form>
					)}
				</Formik>
				<table>
					<thead>
						<tr>
							<th>Přezdívka</th>
							<th>Email</th>
							<th>Akce</th>
						</tr>
					</thead>
					<tbody>
						{players?.map(player => {
							if (player.playerId !== userId) {
								return (
									<tr key={player.id}>
										<td className="text-center">{player.username}</td>
										<td>{player.email}</td>
										<td>
											<Trash onClick={() => {
												setDeletedPlayer({
													id: player.id,
													username: player?.username
												})
											}} 
												className="mx-auto cursor-pointer" size={20} />
										</td>
									</tr>
								)
							}
						})}
					</tbody>
				</table>
			</>
			)}
		</SingleTournamentLayout>
	)
}

export const getServerSideProps = (context: GetServerSidePropsContext) => {
	return {
		props: {
			id: context.query.id
		}
	}
};

export default MyTips;