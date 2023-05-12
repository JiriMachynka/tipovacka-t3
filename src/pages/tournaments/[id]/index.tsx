import SingleTournamentLayout from "@/components/SingleTournamentLayout";
import { type GetServerSidePropsContext } from "next";
import { api } from "~/utils/api";
import { Download, Swords, Users } from "lucide-react";
import Loading from "@/components/Loading";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import updateLocale from "dayjs/plugin/updateLocale";
import "dayjs/locale/cs";
dayjs.locale("cs");
dayjs.extend(relativeTime);
dayjs.extend(updateLocale);

export const SingleTournamentPage = ({ id }: { id: string }) => {
  const { isLoading, data: tournamentData } = api.tournament.getAllTournamentData.useQuery({ tournamentId: parseInt(id) });

  function makeTableCSV() {
    const csv = [];
    const firstRow = ["Hráči / Zápasy"];
    tournamentData?.tournamentMatchTips?.map(match => {
      firstRow.push(`${match.homeTeam.name} - ${match.awayTeam.name}`);
    });
    const tableContent: string[][] = [];
    tournamentData?.players?.map(player => {
      const row = [];
      row.push(player.username);
      tournamentData?.tournamentMatchTips?.map(match => {
        const matchTip = match.userMatchTip.find(tip => tip.playerId === player.id);
        row.push(`${matchTip?.homeScore || 0}:${matchTip?.awayScore || 0}`);
      });
      tableContent.push(row as string[]);
    });
    csv.push(firstRow, ...tableContent);
    const csvContent = "data:text/csv;charset=utf-8," + csv.map(e => e.join(";")).join("\n");
    const encodedUri = encodeURI(csvContent);
    window.open(encodedUri);
  }

  return (
    <SingleTournamentLayout>
      {isLoading ? <Loading /> : (
      <>
        <div className="flex justify-center items-center gap-4">
          <h1 className="text-center text-4xl font-semibold">
            {tournamentData?.name}
          </h1>
          <Download className="cursor-pointer" onClick={makeTableCSV} />
        </div>
        <div className="flex justify-center">
          <div className="flex flex-col border border-slate-50 border-r border-r-transparent">
            <div className="border-b border-slate-50 flex flex-col-reverse lg:flex-row items-center lg:items-start p-0 lg:p-3 lg:gap-2 justify-center">
              <span className="flex justify-center w-full p-2 lg:p-0"><Users /></span>
              <span className="hidden lg:inline">/</span>
              <span className="flex justify-center w-full p-2 lg:p-0 border-b border-b-slate-50 lg:border-none"><Swords /></span>
            </div>
            {tournamentData?.players?.map(player => (
              <div key={player.playerId} className="px-3 py-2 text-xl [&:not(:last-child)]:border-b border-slate-50">
                {player.username}
              </div>
            ))}
          </div>
          <div className="flex border border-slate-50 overflow-x-auto custom-scrollbar">
            {tournamentData?.tournamentMatchTips?.map(matchTip => (
              <div key={matchTip.id} className="[&:not(:last-child)]:border-r border-r-slate-50">
                <div className="border-b border-b-slate-50 flex flex-col lg:flex-row p-0 lg:p-3 gap-0 lg:gap-2">
                  <span className="p-2 lg:p-0 border-b border-b-slate-50 lg:border-none">{matchTip.homeTeam.name}</span>
                  <span className="hidden lg:inline-block">-</span> 
                  <span className="p-2 lg:p-0">{matchTip.awayTeam.name}</span>
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
      </>)}
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