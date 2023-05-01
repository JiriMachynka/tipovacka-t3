import SingleTournamentLayout from "@/components/SingleTournamentLayout";
import { type GetServerSidePropsContext } from "next";
import { api } from "~/utils/api";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import updateLocale from "dayjs/plugin/updateLocale";
import "dayjs/locale/cs";
import { Download, Swords, Users } from "lucide-react";
import {  useState } from "react";
import { Button } from "@/components/ui/button";
import clsx from "clsx";
dayjs.locale("cs");
dayjs.extend(relativeTime);
dayjs.extend(updateLocale);

export const SingleTournamentPage = ({ id }: { id: string }) => {
  const { data: tournamentData } = api.tournament.getAllTournamentData.useQuery({ tournamentId: parseInt(id) });
  const [pagination, setPagination] = useState<number>(0);

  if (!tournamentData) return null;
  
  function makeTableCSV() {
    const csv = [];
    const firstRow = ["Hráči / Zápasy"];
    tournamentData?.tournamentMatchTips?.map(match => {
      firstRow.push(`${match.homeTeam.name} - ${match.awayTeam.name}`);
    });
    const tableContent: any = [];
    tournamentData?.players?.map(player => {
      const row = [];
      row.push(player.username);
      tournamentData?.tournamentMatchTips?.map(match => {
        const matchTip = match.userMatchTip.find(tip => tip.playerId === player.id);
        row.push(`${matchTip?.homeScore || 0}:${matchTip?.awayScore || 0}`);
      });
      tableContent.push(row);
    });
    csv.push(firstRow, ...tableContent);
    const csvContent = "data:text/csv;charset=utf-8," + csv.map(e => e.join(";")).join("\n");
    const encodedUri = encodeURI(csvContent);
    window.open(encodedUri);
  }

  return (
    <SingleTournamentLayout>
      <>
        <div className="flex justify-center items-center gap-4">
          <h1 className="text-center text-4xl font-semibold">
            {tournamentData.name}
          </h1>
          <Download className="cursor-pointer" onClick={makeTableCSV} />
        </div>
        <div className="flex justify-center">
          <div className="flex flex-col border border-slate-50 border-r border-r-transparent">
            <div className="p-3 border-b border-slate-50 flex gap-2 justify-center">
              <Users />/<Swords />
            </div>
            {tournamentData.players?.map(player => (
              <div key={player.id} className="px-3 py-2 text-xl [&:not(:last-child)]:border-b border-slate-50">
                {player.username}
              </div>
            ))}
          </div>
          <div className="flex border border-slate-50">
            {tournamentData.tournamentMatchTips?.slice(pagination, pagination + 4).map(matchTip => (
              <div key={matchTip.id} className="[&:not(:last-child)]:border-r border-r-slate-50">
                <div className="border-b border-b-slate-50 p-3">
                  {matchTip.homeTeam.name} - {matchTip.awayTeam.name}
                </div>
                {matchTip.userMatchTip.map(userMatchTip => {
                  return (
                    <div key={userMatchTip.id} className="[&:not(:last-child)]:border-b border-slate-50 flex justify-center text-xl gap-1 py-2">
                      <span>{userMatchTip.homeScore}</span>
                      :
                      <span>{userMatchTip.awayScore}</span>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
        {tournamentData.tournamentMatchTips && tournamentData.tournamentMatchTips.length > 1 && (
          <div className="flex justify-center gap-3">
            {[...new Array<number[]>(Math.ceil(tournamentData.tournamentMatchTips.length / 4))].map((_, idx) => {
              return (
                <Button key={idx} className={clsx("text-xl border-2 border-slate-50", {
                  "bg-slate-50 text-slate-800": pagination === idx
                })} onClick={() => setPagination(idx)}>{idx + 1}</Button>
              )
            })}
          </div>
        )}
      </>
    </SingleTournamentLayout>
  )
}

export const getServerSideProps = (ctx: GetServerSidePropsContext) => {
  return {
    props: {
      id: ctx.query.id
    }
  }
}

export default SingleTournamentPage;