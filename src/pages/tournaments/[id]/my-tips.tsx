import SingleTournamentLayout from "@/components/SingleTournamentLayout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Formik } from "formik";
import { Fragment, useState } from "react";
import { api } from "~/utils/api";
import { type GetServerSidePropsContext } from "next";
import { Edit } from "lucide-react";
import { type TEditedMatch } from "@/types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import dayjs from "dayjs";
import { cn } from "@/lib/utils";
import { type Team } from "@prisma/client";

export const MyTips = ({ id }: { id: string }) => {
  const { toast } = useToast();
  const [myTipsOpened, setMyTipsOpened] = useState<boolean>(false);
  const [editedMatch, setEditedMatch] = useState<TEditedMatch>(null);
  const utils = api.useContext();

  const { data: overallTipsData } = api.tournament.getTournamentOverallTips.useQuery({ tournamentId: parseInt(id) })
  const { data: groups } = api.teams.getGroups.useQuery({ tournamentId: parseInt(id) });
  const { data: sortedTeams } = api.teams.getSortedTeams.useQuery({ tournamentId: parseInt(id) })
  const { data: tournamentData } = api.tournament.getTournamentById.useQuery({ tournamentId: parseInt(id) });
  const { data: userMatchTips } = api.matches.getPlayerMatches.useQuery();
  const { data: scorers } = api.players.getPlayerScorers.useQuery({ tournamentId: parseInt(id) });
  const { data: allScorers } = api.tournament.getScorers.useQuery({ tournamentId: parseInt(id) });

  const { mutate: updateMyTips } = api.tournament.updateTournamentOverallTips.useMutation({
    onSuccess() {
      setMyTipsOpened(prev => !prev);
      toast({
        title: "Uloženo",
        description: "Tipy byly úspěšně uloženy",
      });
    },
    onError() {
      toast({
        title: "Chyba",
        description: "Nepodařilo se uložit tipy",
      });
    }
  });
  const { mutate: updateUserMatchTip } = api.matches.updateUserMatchTip.useMutation({
    onSuccess() {
      toast({
        title: "Uloženo",
        description: "Tipy byl úspěšně uložen",
      });
      void utils.matches.invalidate();
    },
    onError() {
      toast({
        title: "Chyba",
        description: "Nepodařilo se uložit tip",
      });
    }
  })
  const { mutate: updateScorers } = api.players.createScorer.useMutation({
    onSuccess() {
      toast({
        title: "Uloženo",
        description: "Střelci byli úspěšně uloženi",
      });
      void utils.matches.invalidate();
    },
    onError() {
      toast({
        title: "Chyba",
        description: "Nepodařilo se uložit střelce",
      });
    }
  });

  if (!sortedTeams || !groups || !tournamentData || !overallTipsData || !userMatchTips) return null

  const tournamentGroups = [...new Set(tournamentData?.teams.map((team: Team) => team.groupName))];

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
                            <Select name="group" value={props.values.group} onValueChange={(value) => props.setFieldValue("group", value)} disabled>
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
                              <Select name="homeTeam" value={props.values.homeTeam} onValueChange={(value) => props.setFieldValue("homeTeam", value)} disabled>
                                <SelectTrigger value={props.values.homeTeam}>
                                  <SelectValue placeholder="Zvol domácí tým" />
                                </SelectTrigger>
                                <SelectContent>
                                  {tournamentData?.teams.filter(team => team.groupName === props.values.group).map(team => (
                                    <SelectItem key={team.id} value={team.name}>{team.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Select name="awayTeam" value={props.values.awayTeam} onValueChange={(value) => props.setFieldValue("awayTeam", value)} disabled>
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
        <Accordion type="single" collapsible={myTipsOpened} className="w-1/2 mx-auto" onClick={() => setMyTipsOpened(!myTipsOpened)}>
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-2xl uppercase">Moje tipy</AccordionTrigger>
            <AccordionContent>
              <Formik
                initialValues={{
                  winner: overallTipsData?.winner?.name || "",
                  semifinalistFirst: overallTipsData?.semifinalistFirst?.name || "",
                  semifinalistSecond: overallTipsData?.semifinalistSecond?.name || ""
                }}
                onSubmit={(values) => {
                  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                  const winnerId = sortedTeams.filter(team => team.name === values.winner)[0]!.id;
                  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                  const semifinalistFirstId = sortedTeams.filter(team => team.name === values.semifinalistFirst)[0]!.id;
                  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                  const semifinalistSecondId = sortedTeams.filter(team => team.name === values.semifinalistSecond)[0]!.id;
                  updateMyTips({
                    tournamentId: parseInt(id),
                    winnerId,
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
                            sortedTeams.filter(team => team.groupName === group.groupName).map((team, idx) => (
                              <Fragment key={`${group.groupName}${idx}`}>
                                {idx === 0 && <SelectGroup key={group.groupName} className={cn("px-5 font-bold text-lg", {
                                  "mt-2": groupIdx !== 0
                                })}>{group.groupName}</SelectGroup>}
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
                          <SelectValue placeholder={props.initialValues.semifinalistFirst || "Zvol prvního semifinalisti"} />
                        </SelectTrigger>
                        <SelectContent className="flex flex-col">
                          {groups.map((group, groupIdx) => (
                            sortedTeams.filter(team => team.groupName === group.groupName).map((team, idx) => (
                              <Fragment key={`${group.groupName}${idx}`}>
                                {idx === 0 && <SelectGroup key={group.groupName} className={cn("px-5 font-bold text-lg", {
                                  "mt-2": groupIdx !== 0
                                })}>{group.groupName}</SelectGroup>}
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
                          <SelectValue placeholder={props.initialValues.semifinalistSecond || "Zvol druhého semifinalisti"} />
                        </SelectTrigger>
                        <SelectContent className="flex flex-col">
                          {groups.map((group, groupIdx) => (
                            sortedTeams.filter(team => team.groupName === group.groupName).map((team, idx) => (
                              <Fragment key={`${group.groupName}${idx}`}>
                                {idx === 0 && <SelectGroup key={group.groupName} className={cn("px-5 font-bold text-lg", {
                                  "mt-2": groupIdx !== 0
                                })}>{group.groupName}</SelectGroup>}
                                <SelectItem key={team.id} value={team.name} className="text-md">{team.name}</SelectItem>
                              </Fragment>
                            ))
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit">Uložit tipy</Button>
                  </form>
                )}
              </Formik>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <Accordion type="single" collapsible={myTipsOpened} className="w-1/2 mx-auto" onClick={() => setMyTipsOpened(!myTipsOpened)}>
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-2xl uppercase">Střelci</AccordionTrigger>
            <AccordionContent>
              <Formik
                initialValues={{
                  scorerFirstFirstName: scorers?.scorerFirst?.firstName || "",
                  scorerFirstLastName: scorers?.scorerFirst?.lastName || "",
                  scorerSecondFirstName: scorers?.scorerSecond?.firstName  || "",
                  scorerSecondLastName: scorers?.scorerSecond?.lastName || ""
                }}
                onSubmit={(values) => {
                  console.log(values);
                  const { scorerFirstFirstName, scorerFirstLastName, scorerSecondFirstName, scorerSecondLastName } = values;
                  console.log(allScorers?.filter(scorer => scorer.firstName.includes(scorerFirstFirstName)));
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
        {userMatchTips.filter(matchTip => !matchTip.tournamentMatchTip.locked).length > 0 && (
        <Accordion type="single" collapsible={myTipsOpened} className="w-1/2 mx-auto" onClick={() => setMyTipsOpened(!myTipsOpened)}>
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-2xl uppercase">Zápasy</AccordionTrigger>
            <AccordionContent>
              <table className="w-[calc(100%-20px)] mx-auto">
                <thead>
                  <tr>
                    <th>Začátek zápasu</th>
                    <th>Domácí</th>
                    <th>Skóre</th>
                    <th>Hosté</th>
                    <th>Akce</th>
                  </tr>
                </thead>
                <tbody>
                  {userMatchTips.filter(tip => !tip.tournamentMatchTip.locked).map(match => {
                    return (
                      <tr key={match.id}>
                        <td className="text-xl font-semibold text-center py-3">{dayjs(match.tournamentMatchTip.date).fromNow()}</td>
                        <td className="text-xl font-semibold text-center py-3">{match.tournamentMatchTip.homeTeam.name}</td>
                        <td className="text-xl font-semibold text-center py-3">{match.homeScore}:{match.awayScore}</td>
                        <td className="text-xl font-semibold text-center py-3">{match.tournamentMatchTip.awayTeam.name}</td>
                        <td className="text-xl font-semibold py-3">
                          <Edit onClick={() => {
                            setEditedMatch({
                              date: dayjs(match.tournamentMatchTip.date).format("YYYY-MM-DDThh:mm"),
                              matchId: match.id,
                              group: match.tournamentMatchTip.homeTeam.groupName,
                              homeTeamId: match.tournamentMatchTip.homeTeam.id,
                              awayTeamId: match.tournamentMatchTip.awayTeam.id,
                              homeTeam: match.tournamentMatchTip.homeTeam.name,
                              awayTeam: match.tournamentMatchTip.awayTeam.name,
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

export const getServerSideProps = (context: GetServerSidePropsContext) => {
  return {
    props: {
      id: context.query.id
    }
  }
};

export default MyTips;