import type { GetStaticProps } from "next";
import { generateSSGHelper } from "~/server/helpers/ssgHelper";
import SingleTournamentLayout from "@/components/SingleTournamentLayout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Formik } from "formik";
import { Fragment, useState } from "react";
import { api } from "~/utils/api";
import { Edit } from "lucide-react";
import { type EditedMatch } from "@/types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import updateLocale from "dayjs/plugin/updateLocale";
import "dayjs/locale/cs";
dayjs.locale("cs");
dayjs.extend(relativeTime);
dayjs.extend(updateLocale);

export default function MyTips({ id }: { id: string }) {
  const { toast } = useToast();
  const [myTipsOpened, setMyTipsOpened] = useState(false);
  const [editedMatch, setEditedMatch] = useState<EditedMatch>(null);
  const utils = api.useContext();

  const { data: overallTipsData } = api.tournament.getTournamentOverallTips.useQuery();
  const { data: groups } = api.teams.getGroups.useQuery({ tournamentId: parseInt(id) });
  const { data: sortedTeams } = api.teams.getSortedTeams.useQuery({ tournamentId: parseInt(id) })
  const { data: userMatchTips } = api.matches.getPlayerMatches.useQuery({ tournamentId: parseInt(id) });
  const { data: scorers } = api.players.getPlayerScorers.useQuery({ tournamentId: parseInt(id) });

  const { mutate: updateMyTips } = api.tournament.updateTournamentOverallTips.useMutation({
    onSuccess() {
      setMyTipsOpened(prev => !prev);
      toast({
        title: "Uloženo",
        description: "Tip byly úspěšně uloženy",
      });
    },
    onError() {
      toast({
        title: "Chyba",
        description: "Nepodařilo se uložit tip",
        variant: "destructive"
      });
    }
  });
  const { mutate: updateUserMatchTip } = api.matches.updateUserMatchTip.useMutation({
    onSuccess() {
      toast({
        title: "Uloženo",
        description: "Tipy byl úspěšně uložen",
      });
      void utils.matches.getPlayerMatches.invalidate();
    },
    onError() {
      toast({
        title: "Chyba",
        description: "Nepodařilo se uložit tip",
        variant: "destructive"
      });
    }
  })
  const { mutate: updateScorers } = api.players.createScorer.useMutation({
    onSuccess() {
      toast({
        title: "Uloženo",
        description: "Střelci byli úspěšně uloženi",
      });
      void utils.players.getPlayerScorers.invalidate();
    },
    onError() {
      toast({
        title: "Chyba",
        description: "Nepodařilo se uložit střelce",
        variant: "destructive"
      });
    }
  });

  if (!sortedTeams || !groups || !overallTipsData || !userMatchTips) return null

  return (
    <SingleTournamentLayout>
      <>
      {editedMatch && (
        <AlertDialog open={!!editedMatch}>
          <AlertDialogContent className="bg-primary">
            <Formik
              initialValues={{
                date: dayjs(editedMatch.date).format("YYYY-MM-DDThh:mm"),
                matchId: editedMatch.matchId,
                group: editedMatch.group,
                homeTeamName: editedMatch.homeTeamName,
                awayTeamName: editedMatch.awayTeamName,
                homeScore: editedMatch.homeScore,
                awayScore: editedMatch.awayScore
              }}
              onSubmit={(values) => {
                updateUserMatchTip({
                  matchId: values.matchId,
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
                            disabled
                          />
                          <Select name="group" value={props.values.group} disabled>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Zvol skupinu" />
                            </SelectTrigger>
                            <SelectContent>
                              {groups.map((group) => (
                                <SelectItem key={group.name} value={group.name}>{group.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex gap-5">
                          <div className="flex gap-5 w-full">
                            <Select name="homeTeamName" value={props.values.homeTeamName} disabled>
                              <SelectTrigger value={props.values.homeTeamName}>
                                <SelectValue placeholder="Zvol domácí tým" />
                              </SelectTrigger>
                              <SelectContent>
                                {sortedTeams.filter(team => team.groupName === props.values.group).map(team => (
                                  <SelectItem key={team.id} value={team.name}>{team.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select name="awayTeamName" value={props.values.awayTeamName} disabled>
                              <SelectTrigger value={props.values.awayTeamName}>
                                <SelectValue placeholder="Zvol hostující tým" />
                              </SelectTrigger>
                              <SelectContent>
                                {sortedTeams.filter(team => team.groupName === props.values.group && team.name !== props.values.homeTeamName).map(team => (
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
      <Accordion type="single" collapsible={myTipsOpened} className="w-full lg:w-1/2 lg:mx-auto" onClick={() => setMyTipsOpened(!myTipsOpened)}>
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-2xl uppercase">Moje tipy</AccordionTrigger>
          <AccordionContent>
            <Formik
              initialValues={{
                winner: overallTipsData.winnerName || "",
                finalist: overallTipsData.finalistName || "",
                semifinalistFirst: overallTipsData.semifinalistFirstName || "",
                semifinalistSecond: overallTipsData.semifinalistSecondName || ""
              }}
              onSubmit={(values) => {
                const winnerId = sortedTeams.filter(team => team.name === values.winner)[0]?.id as number;
                const finalistId = sortedTeams.filter(team => team.name === values.finalist)[0]?.id as number;
                const semifinalistFirstId = sortedTeams.filter(team => team.name === values.semifinalistFirst)[0]?.id as number;
                const semifinalistSecondId = sortedTeams.filter(team => team.name === values.semifinalistSecond)[0]?.id as number;
                updateMyTips({
                  tournamentId: parseInt(id),
                  winnerId,
                  finalistId,
                  semifinalistFirstId,
                  semifinalistSecondId
                });
              }}
            >
              {props => (
                <form onSubmit={props.handleSubmit} className="flex flex-col mx-auto gap-5 w-[calc(100%-20px)]">
                  <div className="flex flex-col gap-3">
                    <Label htmlFor="winner">Vítěz</Label>
                    <Select onValueChange={(value) => props.setFieldValue("winner", value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={props.initialValues.winner || "Zvol vítěze"} />
                      </SelectTrigger>
                      <SelectContent className="flex flex-col">
                        {groups.map((group, groupIdx) => (
                          sortedTeams.filter(team => team.groupName === group.name).map((team, idx) => (
                            <Fragment key={`${group.name}${idx}`}>
                              {idx === 0 && <SelectGroup key={group.name} className={cn("px-5 font-bold text-lg", {
                                "mt-2": groupIdx !== 0
                              })}>{group.name}</SelectGroup>}
                              <SelectItem key={team.id} value={team.name} className="text-md">{team.name}</SelectItem>
                            </Fragment>
                          ))
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Label htmlFor="finalist">Finalista</Label>
                    <Select onValueChange={(value) => props.setFieldValue("finalist", value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={props.initialValues.finalist || "Zvol finalistu"} />
                      </SelectTrigger>
                      <SelectContent className="flex flex-col">
                        {groups.map((group, groupIdx) => (
                          sortedTeams.filter(team => team.name === group.name).map((team, idx) => (
                            <Fragment key={`${group.name}${idx}`}>
                              {idx === 0 && <SelectGroup key={group.name} className={cn("px-5 font-bold text-lg", {
                                "mt-2": groupIdx !== 0
                              })}>{group.name}</SelectGroup>}
                              <SelectItem key={team.id} value={team.name} className="text-md">{team.name}</SelectItem>
                            </Fragment>
                          ))
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Label htmlFor="semifinalistFirst">První semifinalista</Label>
                    <Select name="semifinalistFirst" onValueChange={(value) => props.setFieldValue("semifinalistFirst", value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={props.initialValues.semifinalistFirst || "Zvol prvního semifinalistu"} />
                      </SelectTrigger>
                      <SelectContent className="flex flex-col">
                        {groups.map((group, groupIdx) => (
                          sortedTeams.filter(team => team.name === group.name).map((team, idx) => (
                            <Fragment key={`${group.name}${idx}`}>
                              {idx === 0 && <SelectGroup key={group.name} className={cn("px-5 font-bold text-lg", {
                                "mt-2": groupIdx !== 0
                              })}>{group.name}</SelectGroup>}
                              <SelectItem key={team.id} value={team.name} className="text-md">{team.name}</SelectItem>
                            </Fragment>
                          ))
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Label htmlFor="semifinalistSecond">Druhý semifinalista</Label>
                    <Select name="semifinalistSecond" onValueChange={(value) => props.setFieldValue("semifinalistSecond", value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={props.initialValues.semifinalistSecond || "Zvol druhého semifinalistu"} />
                      </SelectTrigger>
                      <SelectContent className="flex flex-col">
                        {groups.map((group, groupIdx) => (
                          sortedTeams.filter(team => team.name === group.name).map((team, idx) => (
                            <Fragment key={`${group.name}${idx}`}>
                              {idx === 0 && <SelectGroup key={group.name} className={cn("px-5 font-bold text-lg", {
                                "mt-2": groupIdx !== 0
                              })}>{group.name}</SelectGroup>}
                              <SelectItem key={team.id} value={team.name} className="text-md">{team.name}</SelectItem>
                            </Fragment>
                          ))
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" disabled>Uložit tipy</Button>
                </form>
              )}
            </Formik>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <Accordion type="single" collapsible={myTipsOpened} className="w-full lg:w-1/2 lg:mx-auto" onClick={() => setMyTipsOpened(!myTipsOpened)}>
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-2xl uppercase">Střelci</AccordionTrigger>
          <AccordionContent>
            <Formik
              initialValues={{
                scorerFirstFirstName: scorers?.scorerFirstFirstName || "",
                scorerFirstLastName: scorers?.scorerFirstLastName || "",
                scorerSecondFirstName: scorers?.scorerSecondFirstName  || "",
                scorerSecondLastName: scorers?.scorerSecondLastName || ""
              }}
              onSubmit={(values) => {
                const { scorerFirstFirstName, scorerFirstLastName, scorerSecondFirstName, scorerSecondLastName } = values;
                updateScorers({
                  tournamentId: parseInt(id),
                  scorerFirstFirstName,
                  scorerFirstLastName,
                  scorerSecondFirstName,
                  scorerSecondLastName,
                });
              }}
            >
              {props => (
                <form onSubmit={props.handleSubmit} className="flex flex-col mx-auto gap-5 w-[calc(100%-20px)]">
                  <div className="flex flex-col gap-3">
                    <h3 className="text-xl font-bold uppercase">První střelec</h3>
                    <div className="flex gap-5">
                      <div className="flex flex-col w-full relative">
                        <Label>Jméno</Label>
                        <Input type="text" className="w-full" name="scorerFirstFirstName" onChange={props.handleChange} onBlur={props.handleBlur} value={props.values.scorerFirstFirstName} />
                      </div>
                      <div className="flex flex-col w-full">
                        <Label>Příjmení</Label>
                        <Input type="text" className="w-full" name="scorerFirstLastName" onChange={props.handleChange} onBlur={props.handleBlur} value={props.values.scorerFirstLastName} />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <h3 className="text-xl font-bold uppercase">Druhý střelec</h3>
                    <div className="flex gap-5">
                      <div className="flex flex-col w-full">
                        <Label>Jméno</Label>
                        <Input type="text" className="w-full" name="scorerSecondFirstName" onChange={props.handleChange} onBlur={props.handleBlur} value={props.values.scorerSecondFirstName} />
                      </div>
                      <div className="flex flex-col w-full">
                        <Label>Příjmení</Label>
                        <Input type="text" className="w-full" name="scorerSecondLastName" onChange={props.handleChange} onBlur={props.handleBlur} value={props.values.scorerSecondLastName} />
                      </div>
                    </div>
                  </div>
                  <Button type="submit">Uložit střelce</Button>
                </form>
              )}
            </Formik>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      {userMatchTips.length > 0 && (
      <Accordion type="single" collapsible={myTipsOpened} className="w-full lg:w-1/2 lg:mx-auto" onClick={() => setMyTipsOpened(!myTipsOpened)}>
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-2xl uppercase">Zápasy</AccordionTrigger>
          <AccordionContent>
            <table className="w-[calc(100%-20px)] mx-auto">
              <thead>
                <tr>
                  <th>Start</th>
                  <th>Domácí</th>
                  <th>Skóre</th>
                  <th>Hosté</th>
                  <th>Akce</th>
                </tr>
              </thead>
              <tbody>
                {userMatchTips.map(match => {
                  return (
                    <tr key={match.id}>
                      <td className="text-center">{dayjs(match.date).fromNow()}</td>
                      <td className="text-center">{match.homeTeamName}</td>
                      <td className="text-center">{match.homeScore}:{match.awayScore}</td>
                      <td className="text-center">{match.awayTeamName}</td>
                      <td>
                        <Edit onClick={() => {
                          setEditedMatch({
                            date: dayjs(match.date).format("YYYY-MM-DDThh:mm"),
                            matchId: match.id,
                            group: match.homeTeamGroupName,
                            homeTeamId: match.homeTeamId,
                            awayTeamId: match.awayTeamId,
                            homeTeamName: match.homeTeamName,
                            awayTeamName: match.awayTeamName,
                            homeScore: match.homeScore,
                            awayScore: match.awayScore
                          })
                        }} className="mx-auto cursor-pointer" size={25} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </AccordionContent>
        </AccordionItem>
      </Accordion>)}
      </>
    </SingleTournamentLayout>
  )
}

export const getStaticProps: GetStaticProps = async (context) => {
  const ssg = generateSSGHelper();

  const id = context.params?.id;

  if (typeof id !== "string") throw new Error("No id");

  await ssg.tournament.getTournamentOverallTips.prefetch();
  await ssg.teams.getGroups.prefetch({ tournamentId: parseInt(id) });
  await ssg.teams.getSortedTeams.prefetch({ tournamentId: parseInt(id) });
  await ssg.matches.getPlayerMatches.prefetch({ tournamentId: parseInt(id) });
  await ssg.players.getPlayerScorers.prefetch({ tournamentId: parseInt(id) });

  return {
    props: {
      trpcState: ssg.dehydrate(),
      id,
    },
  };
}

export const getStaticPaths = () => {
  return { 
    paths: [], 
    fallback: false 
  }
}