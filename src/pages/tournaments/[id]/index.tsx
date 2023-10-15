import SingleTournamentLayout from "@/components/SingleTournamentLayout";
import { type GetStaticProps } from "next";
import { api } from "@/utils/api";
import { Download, Swords, Users } from "lucide-react";
import Loading from "@/components/Loading";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import updateLocale from "dayjs/plugin/updateLocale";
import "dayjs/locale/cs";
import { generateSSGHelper } from "@/server/helpers/ssgHelper";
dayjs.locale("cs");
dayjs.extend(relativeTime);
dayjs.extend(updateLocale);

export default function SingleTournamentPage({ id }: { id: string }) {
    const { isLoading, data: tournament } = api.tournament.getAllTournamentData.useQuery({ tournamentId: parseInt(id) });

  function makeTableCSV() {
    // TODO: Completely rewrite download

    // const csv = [];
    // const firstRow = ["Hráči / Zápasy"];
    // tournament?.matches?.map(match => {
    //   firstRow.push(`${match.homeTeamName} - ${match.awayTeamName}`);
    // });
    // const tableContent: string[][] = [];
    // tournament?.data?.map(info => {
    //   const row = [];
    //   row.push(info.username);
    //   tournament?.matches?.map(match => {
    //     const matchTip = match.userMatchTip.find(tip => tip.playerId === player.id);
    //     row.push(`${matchTip?.homeScore || 0}:${matchTip?.awayScore || 0}`);
    //   });
    //   tableContent.push(row as string[]);
    // });
    // csv.push(firstRow, ...tableContent);
    // const csvContent = "data:text/csv;charset=utf-8," + csv.map(e => e.join(";")).join("\n");
    // const encodedUri = encodeURI(csvContent);
    // window.open(encodedUri);
  }
  
  if (!tournament) return null;

  const numberOfMatches: number = tournament.userMatches.length / tournament.data.length;

  return (
    <SingleTournamentLayout>
      {isLoading ? <Loading /> : (
      <>
        <div className="flex justify-center items-center gap-4">
          <h1 className="text-center text-4xl font-semibold">
            {tournament.data[0]?.name}
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
            {tournament.data.map(data => (
              <div key={data.username} className="px-3 py-2 text-xl [&:not(:last-child)]:border-b border-slate-50">
                {data.username}
              </div>
            ))}
          </div>
          <div className="flex border border-slate-50 overflow-x-auto custom-scrollbar">
            {/* TODO: Try to make it clearer 😅 */}
            {Array.from({ length: numberOfMatches }, (_, index) => index).map((col, row) => (
              <div key={tournament.userMatches[row]?.id} className="[&:not(:last-child)]:border-r border-r-slate-50">
                  <div className="border-b border-b-slate-50 flex flex-col lg:flex-row p-0 lg:p-3 gap-0 lg:gap-2">
                    <span className="p-2 lg:p-0 border-b border-b-slate-50 lg:border-none">{tournament.userMatches[row]?.homeTeamName}</span>
                    <span className="hidden lg:inline-block">-</span> 
                    <span className="p-2 lg:p-0">{tournament.userMatches[row]?.awayTeamName}</span>
                  </div>
                  {tournament.userMatches.slice(col * tournament.data.length, col * tournament.data.length + tournament.data.length).map(userMatch => (
                    <div key={userMatch.id} className="[&:not(:last-child)]:border-b border-slate-50 flex justify-center text-xl gap-1 py-2">
                      <span>{userMatch.homeScore}</span> :
                      <span>{userMatch.awayScore}</span>
                    </div>
                  ))}
                </div>
            ))}
          </div>
        </div>
      </>)}
    </SingleTournamentLayout>
  )
}

export const getStaticProps: GetStaticProps = async (context) => {
  const ssg = generateSSGHelper();

  const id = context.params?.id;

  if (typeof id !== "string") throw new Error("No id");

  await ssg.tournament.getAllTournamentData.prefetch({ tournamentId: parseInt(id) });

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