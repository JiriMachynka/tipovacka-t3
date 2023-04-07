import SingleTournamentLayout from "@/components/SingleTournamentLayout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUser } from "@clerk/nextjs";
import { Formik } from "formik";
import { type GetServerSidePropsContext } from "next";
import { Trash, Edit, Lock, Unlock } from "lucide-react";
import { api } from "~/utils/api";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import dayjs from "dayjs";
import { useState } from "react";
import clsx from "clsx";

type TEditedMatch = {
  matchId: number;
  date: string;
  group: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamId: number;
  awayTeamId: number;
  homeScore: number;
  awayScore: number;
}

export const ManageMatches = ({ id }: { id : string }) => {
  const { user } = useUser();
  const [editedMatch, setEditedMatch] = useState<TEditedMatch | null>(null);
  const utils = api.useContext();
  const { mutate: unlockMatch } = api.matches.unlockMatch.useMutation({
    onSuccess: () => {
      console.log("Match unlocked successfully");
      void utils.matches.invalidate();
    },
    onError: (error) => {
      console.log(error);
    }
  })
  const { mutate: lockMatch } = api.matches.lockMatch.useMutation({
    onSuccess: () => {
      console.log("Match locked successfully");
      void utils.matches.invalidate();
    },
    onError: (error) => {
      console.log(error);
    }
  })
  const { mutate: deleteMatch } = api.matches.deleteMatch.useMutation({
    onSuccess: () => {
      console.log("Match deleted successfully");
      void utils.matches.invalidate();
    },
    onError: (error) => {
      console.log(error);
    }
  });
  const { mutate: updateMatch } = api.matches.updateMatch.useMutation({
    onSuccess: () => {
      console.log("Match edited successfully");
      void utils.matches.invalidate();
    },
    onError: (error) => {
      console.log(error);
    }
  });
  const { mutate: createMatch } = api.matches.createMatch.useMutation({
    onSuccess: () => {
      console.log("Match created successfully");
      void utils.matches.invalidate();
    },
    onError: (error) => {
      console.log(error);
    }
  });
  const { data: tournamentData } = api.tournament.getTournamentById.useQuery({ tournamentId: id });
  const { data: matches } = api.matches.getMatches.useQuery({ tournamentId: parseInt(id) });

  if (!user?.username || !matches) return null
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  const tournamentGroups = [... new Set(tournamentData?.teams.map(team => team.groupName))];
  return (
    <SingleTournamentLayout>
      <>
        {editedMatch && (
          <AlertDialog open={!!editedMatch}>
            <AlertDialogContent className="bg-[#11132b]">
              <Formik
                initialValues={{
                  date: dayjs(editedMatch.date).format("YYYY-MM-DDThh:mm"),
                  matchId: editedMatch.matchId,
                  group: editedMatch.group,
                  homeTeam: editedMatch.homeTeam,
                  awayTeam: editedMatch.awayTeam,
                  homeScore: editedMatch.homeScore,
                  awayScore: editedMatch.awayScore
                }}
                onSubmit={(values) => {
                  const parsedDate = new Date(values.date);
                  updateMatch({
                    tournamentId: parseInt(id),
                    matchId: values.matchId,
                    date: parsedDate,
                    homeTeam: values.homeTeam,
                    awayTeam: values.awayTeam,
                    homeScore: values.homeScore,
                    awayScore: values.awayScore
                  });
                  setEditedMatch(null);
                }}
              >
                {props => (
                  <form onSubmit={props.handleSubmit}>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-3xl text-slate-50 text-center pb-5">Jsi v režimu úpravy zápasu</AlertDialogTitle>
                      <AlertDialogDescription className="flex flex-col gap-3 text-xl font-bold text-slate-50 text-center py-2" asChild>
                        <div className="flex flex-col">
                          <div className="flex flex-col gap-5">
                            <Input 
                              type="datetime-local"
                              className="date-picker w-full text-base"
                              name="date"
                              value={props.values.date}
                              onChange={props.handleChange}
                            />
                            <Select name="group" value={props.values.group} onValueChange={(value) => props.setFieldValue("group", value)}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Zvol skupinu" />
                              </SelectTrigger>
                              <SelectContent>
                                {tournamentGroups.map((group: string) => (
                                  <SelectItem key={group} value={group}>{group}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex gap-5">
                            <div className="flex gap-5 w-full">
                              <Select name="homeTeam" value={props.values.homeTeam} onValueChange={(value) => props.setFieldValue("homeTeam", value)}>
                                <SelectTrigger value={props.values.homeTeam}>
                                  <SelectValue placeholder="Zvol domácí tým" />
                                </SelectTrigger>
                                <SelectContent>
                                  {tournamentData?.teams.filter(team => team.groupName === props.values.group).map(team => (
                                    <SelectItem key={team.id} value={team.name}>{team.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Select name="awayTeam" value={props.values.awayTeam} onValueChange={(value) => props.setFieldValue("awayTeam", value)}>
                                <SelectTrigger value={props.values.awayTeam}>
                                  <SelectValue placeholder="Zvol hostující tým" />
                                </SelectTrigger>
                                <SelectContent>
                                  {tournamentData?.teams.filter(team => team.groupName === props.values.group && team.name !== props.values.homeTeam).map(team => (
                                    <SelectItem key={team.id} value={team.name}>{team.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="flex gap-5">
                            <Input
                              type="number"
                              min="0"
                              onChange={props.handleChange}
                              value={props.values.homeScore}
                              name="homeScore"
                              className="w-full"
                            />
                            <Input
                              type="number"
                              min="0"
                              onChange={props.handleChange}
                              value={props.values.awayScore}
                              name="awayScore"
                              className="w-full"
                            />
                          </div>
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-slate-100 text-black font-bold hover:bg-slate-300 text-lg" onClick={() => setEditedMatch(null)}>Zrušit</AlertDialogCancel>
                      <AlertDialogAction asChild>
                        <Button type="submit" className="text-lg bg-amber-600 text-black font-bold hover:bg-amber-500 focus:ring-amber-600">
                          Upravit
                        </Button>
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </form>
                )}
              </Formik>
            </AlertDialogContent>
          </AlertDialog>
        )}
        <h1 className="text-center text-2xl font-semibold uppercase">Spravovat zápasy</h1>
        <Formik
          initialValues={{
            date: "",
            group: "",
            awayTeam: "",
            homeTeam: "",
          }}
          onSubmit={(values, actions) => {
            const { date, homeTeam, awayTeam } = values;
            const parsedDate = new Date(date);
            const homeTeamId = tournamentData?.teams.filter(team => team.name === homeTeam)[0]?.id;
            const awayTeamId = tournamentData?.teams.filter(team => team.name === awayTeam)[0]?.id;
            if (homeTeamId && awayTeamId) {
              createMatch({
                date: parsedDate,
                tournamentId: parseInt(id),
                homeTeamId,
                awayTeamId,
              });
              actions.resetForm();
              actions.setSubmitting(false);
            }
          }}
        >
          {props => (
            <form onSubmit={props.handleSubmit} className="flex flex-col gap-10">
              <div className="flex flex-col gap-3 mx-auto w-1/2">
                <div className="flex flex-col gap-5">
                  <Input 
                    type="datetime-local"
                    className="date-picker w-full"
                    name="date"
                    value={props.values.date}
                    onChange={props.handleChange}
                  />
                  <Select name="group" onValueChange={(value) => props.setFieldValue("group", value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Zvol skupinu" />
                    </SelectTrigger>
                    <SelectContent>
                      {tournamentGroups.map((group: string) => (
                        <SelectItem key={group} value={group}>{group}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-5">
                  <div className="flex gap-5">
                    <Select name="homeTeam" onValueChange={(value) => props.setFieldValue("homeTeam", value)}>
                      <SelectTrigger className="w-full" value={props.values.homeTeam}>
                        <SelectValue placeholder="Zvol domácí tým" />
                      </SelectTrigger>
                      <SelectContent>
                        {tournamentData?.teams.filter(team => team.groupName === props.values.group).map(team => (
                          <SelectItem key={team.id} value={team.name}>{team.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select name="awayTeam" onValueChange={(value) => props.setFieldValue("awayTeam", value)}>
                      <SelectTrigger className="w-full" value={props.values.awayTeam}>
                        <SelectValue placeholder="Zvol hostující tým" />
                      </SelectTrigger>
                      <SelectContent>
                        {tournamentData?.teams.filter(team => team.groupName === props.values.group && team.name !== props.values.homeTeam).map(team => (
                          <SelectItem key={team.id} value={team.name}>{team.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Button type="submit" className="text-2xl uppercase font-semibold w-full" disabled={props.isSubmitting}>Vytvořit zápas</Button>
                </div>
              </div>
              {matches && (
                <table>
                  <thead>
                    <tr>
                      <th>Začátek zápasu</th>
                      <th>Domácí</th>
                      <th>Skóre</th>
                      <th>Hosté</th>
                      <th colSpan={3}>Akce</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matches?.map(match => (
                    <tr key={match.id}>
                      <td className="text-xl font-semibold text-center">{match.date.toISOString()}</td>
                      <td className="text-xl font-semibold text-center">{match.homeTeam.name}</td>
                      <td className="text-xl font-semibold text-center">{match.homeScore}:{match.awayScore}</td>
                      <td className="text-xl font-semibold text-center">{match.awayTeam.name}</td>
                      <td className={clsx("text-xl font-semibold", {
                        "hidden": match.locked
                      })}>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Trash className="mx-auto cursor-pointer" size={20} />
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-3xl">Chceš smazat tento zápas?</AlertDialogTitle>
                              <AlertDialogDescription className="text-xl font-bold text-black text-center py-2">
                                {match.homeTeam.name} vs. {match.awayTeam.name}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Zrušit</AlertDialogCancel>
                              <AlertDialogAction className="bg-red-600 hover:bg-red-700 focus:ring-red-700" onClick={() => deleteMatch({
                                matchId: match.id
                              })}>Smazat</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </td>
                      <td className={clsx("text-xl font-semibold", {
                        "hidden": match.locked
                      })}>
                        <Edit onClick={() => {
                          setEditedMatch({
                            date: dayjs(match.date).format("YYYY-MM-DDThh:mm"),
                            matchId: match.id,
                            group: match.homeTeam.groupName,
                            homeTeamId: match.homeTeam.id,
                            awayTeamId: match.awayTeam.id,
                            homeTeam: match.homeTeam.name,
                            awayTeam: match.awayTeam.name,
                            homeScore: match.homeScore,
                            awayScore: match.awayScore
                          })
                        }} className="mx-auto cursor-pointer" size={20} />
                        
                      </td>
                      <td className="text-xl font-semibold" colSpan={match.locked ? 3 : 1}>
                        {match.locked ? (
                          <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Unlock className="mx-auto cursor-pointer" size={20} />
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-3xl">Chceš odemknout tento zápas?</AlertDialogTitle>
                              <AlertDialogDescription className="text-xl font-bold text-black text-center py-2">
                                {match.homeTeam.name} vs. {match.awayTeam.name}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Zrušit</AlertDialogCancel>
                              <AlertDialogAction className="bg-red-600 hover:bg-red-700 focus:ring-red-700" onClick={() => unlockMatch({
                                matchId: match.id
                              })}>Odemknout</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        ) : (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Lock className="mx-auto cursor-pointer" size={20} />
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-3xl">Chceš uzamknout tento zápas?</AlertDialogTitle>
                                <AlertDialogDescription className="text-xl font-bold text-black text-center py-2">
                                  {match.homeTeam.name} vs. {match.awayTeam.name}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Zrušit</AlertDialogCancel>
                                <AlertDialogAction className="bg-red-600 hover:bg-red-700 focus:ring-red-700" onClick={() => lockMatch({
                                  matchId: match.id
                                })}>Uzamknout</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </td>
                    </tr> 
                  ))}
                  </tbody>
                </table>
              )}
            </form>
          )}
        </Formik>
      </>
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

export default ManageMatches;