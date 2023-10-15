import Loading from "@/components/Loading";
import SingleTournamentLayout from "@/components/SingleTournamentLayout";
import type { GetStaticProps } from "next";
import { generateSSGHelper } from "@/server/helpers/ssgHelper";
import { api } from "@/utils/api";

export default function Leaderboard({ id }: { id: string }) {
  const { isLoading, data: leaderboard } = api.players.getLeaderboardData.useQuery({ tournamentId: parseInt(id) });

  return (
    <SingleTournamentLayout>
      <>
      {isLoading ? <Loading /> : (
        <table className="w-full lg:w-3/4 lg:mx-auto">
          <thead>
            <tr>
              <th>Pořadí</th>
              <th>Hráč</th>
              <th>Body</th>
            </tr>
          </thead>
          <tbody>
          {leaderboard?.map(({ username, points }, idx) => (
            <tr key={username}>
              <td className="w-[40px] text-center">{idx + 1}</td>
              <td>{username}</td>
              <td className="w-[100px] text-center">{points || 0}</td>
            </tr>
          ))}
          </tbody>
        </table>
      )}
      </>
    </SingleTournamentLayout>
  )
}

export const getStaticProps: GetStaticProps = async (context) => {
  const ssg = generateSSGHelper();

  const id = context.params?.id;

  if (typeof id !== "string") throw new Error("No id");

  await ssg.players.getLeaderboardData.prefetch({ tournamentId: parseInt(id) });

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