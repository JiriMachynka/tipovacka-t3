import SingleTournamentLayout from "@/components/SingleTournamentLayout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClerk } from "@clerk/nextjs";
import clsx from "clsx";
import { Formik } from "formik";
import { type GetServerSidePropsContext } from "next";
import { Fragment } from "react";
import { api } from "~/utils/api";

export const MyTips = ({ id }: { id : string }) => {
  const { user } = useClerk();
  const { data: groups } = api.teams.getGroups.useQuery({ tournamentId: parseInt(id) });
  const { data: sortedTeams } = api.teams.getSortedTeams.useQuery({ tournamentId: parseInt(id) })
  const { data: tournamentData } = api.tournament.getTournamentById.useQuery({ tournamentId: id });
  // const { data: playerInfo } = api.players.getPlayer.useQuery({
  //   tournamentId: parseInt(id),
  //   username: user!.username as string
  // });
  // const { data: myTipsData } = api.players.getOverallTips.useQuery({ playerId: playerInfo!.id });
  
  const { mutate: updateMyTips } = api.players.updateOverallTips.useMutation();

  if (!tournamentData || !sortedTeams || !groups) return null

  return (
    <SingleTournamentLayout>
      <>
        <h1 className="text-center text-4xl font-semibold">Moje tipy</h1>
        <Accordion type="single" collapsible className="w-1/2 mx-auto">
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-2xl uppercase">Moje tipy</AccordionTrigger>
            <AccordionContent>
              <Formik
                initialValues={{
                  winner: "",
                  semifinalistFirst: "",
                  semifinalistSecond: ""
                }}
                onSubmit={(values) => {
                  const winnerId = sortedTeams.filter(team => team.name === values.winner)[0]!.id;
                  const semifinalistFirstId = sortedTeams.filter(team => team.name === values.semifinalistFirst)[0]!.id;
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
                          <SelectValue placeholder="Zvol vítěze" />
                        </SelectTrigger>
                        <SelectContent className="flex flex-col">
                          {groups.map((group, groupIdx) => (
                            sortedTeams.filter(team => team.groupName === group.groupName).map((team, idx) => (
                              <Fragment key={`${group.groupName}${idx}`}>
                                {idx === 0 && <SelectGroup key={group.groupName} className={clsx("px-5 font-bold text-lg", {
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
                          <SelectValue placeholder="Zvol prvního semifinalisti" />
                        </SelectTrigger>
                        <SelectContent className="flex flex-col">
                          {groups.map((group, groupIdx) => (
                            sortedTeams.filter(team => team.groupName === group.groupName).map((team, idx) => (
                              <Fragment key={`${group.groupName}${idx}`}>
                                {idx === 0 && <SelectGroup key={group.groupName} className={clsx("px-5 font-bold text-lg", {
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
                          <SelectValue placeholder="Zvol druhého semifinalisti" />
                        </SelectTrigger>
                        <SelectContent className="flex flex-col">
                          {groups.map((group, groupIdx) => (
                            sortedTeams.filter(team => team.groupName === group.groupName).map((team, idx) => (
                              <Fragment key={`${group.groupName}${idx}`}>
                                {idx === 0 && <SelectGroup key={group.groupName} className={clsx("px-5 font-bold text-lg", {
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