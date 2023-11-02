import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { api } from "@/utils/api";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/router";
import { Formik } from "formik";
import { useToast } from "@/components/ui/use-toast";
import InfoTooltip from "@/components/ui/InfoTooltip";
import { cn } from "@/lib/utils";

const CreateTournamentPage = () => {
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();
  const { data: userList } = api.users.getAllUsers.useQuery();
  const { mutate: createTournament } = api.tournament.createTournament.useMutation({
    onSuccess(id) {
      toast({
        title: "Vytvořeno",
        description: "Tipovačka byla úspěšně vytvořena",
      });
      void router.push(`/tournaments/${id}`);
    },
    onError() {
      toast({
        title: "Chyba",
        description: "Nepodařilo se vytvořit tipovačku",
      });
    }
  });

  if (!userList) return null;

  return (
    <div className="flex flex-col min-h-screen bg-primary">
      <Link href="/" className={cn(buttonVariants({ size: "default" }), "w-fit mx-auto my-3")}>
        Zpět na tipovačky
      </Link>
      <Formik
        initialValues={{
          tournamentName: "",
          players: "",
          teams: "",
        }}
        onSubmit={(values, actions) => {
          const { tournamentName, teams, players } = values;
          const allPlayers = players?.split("\n").filter(player => player.trim() !== "");

          if (user?.username && allPlayers?.map(player => userList.flatMap(user => user.username).includes(player))) {
            createTournament({
              tournamentName,
              teams: teams.split("\n").map(team => team.split(",").filter(team => team.trim() !== "")),
              players: [user.username, ...allPlayers],
            });
          }
          actions.setSubmitting(false);
        }}
      >
        {props => (
          <form className="flex flex-col gap-5 mx-3 lg:w-full lg:max-w-screen-lg lg:mx-auto" onSubmit={props.handleSubmit}>
            <div className="flex flex-col gap-3">
              <Label htmlFor="tournamentName">Název tipovačky</Label>
              <Input id="tournamentName" name="tournamentName" onChange={props.handleChange} onBlur={props.handleBlur} value={props.values.tournamentName} className="w-full" type="text" placeholder="Název tipovačky" />
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <Label htmlFor="players">Hráči</Label>
                <InfoTooltip>
                  <p className="text-base">Hráči se zadávají ve formátu:</p>
                  <p className="text-base">Každý hráč na novém řádku</p>
                </InfoTooltip>
              </div>
              <Textarea id="players" name="players" onChange={props.handleChange} onBlur={props.handleBlur} value={props.values.players} className="w-full h-52" />
            </div>
            <div className="flex flex-col w-full gap-3">
              <div className="flex gap-3">
                <Label htmlFor="teams">Týmy</Label>
                <InfoTooltip>
                  <p className="text-base">Týmy se zadávají ve formátu:</p>
                  <p className="text-base">Název týmu, Název týmu, Název týmu</p>
                  <p className="text-base">Každý skupina na novém řádku</p>
                </InfoTooltip>
              </div>
              <Textarea id="teams" name="teams" onChange={props.handleChange} onBlur={props.handleBlur} value={props.values.teams} className="h-52" />
            </div>
            <Button className="text-xl py-7 lg:text-3xl lg:py-10" type="submit" disabled={props.isSubmitting}>Vytvořit tipovačku</Button>
          </form>
        )}
      </Formik>
    </div>
  )
}
export default CreateTournamentPage;