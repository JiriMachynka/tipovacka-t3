import Loading from "@/components/Loading";
import SingleTournamentLayout from "@/components/SingleTournamentLayout";
import { cn } from "@/lib/utils";
import { type GetServerSidePropsContext } from "next";
import { api } from "~/utils/api";

const Leaderboard = ({ id }: { id: string }) => {
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
          {leaderboard?.map((playerData, idx) => {
            if (idx < 3) {
              return (
                <tr key={playerData.username}>
                  <td className="w-[40px] text-center">{idx + 1}</td>
                  <td>{playerData.username}</td>
                  <td className="w-[100px] text-center">{playerData.points}</td>
                </tr>
              )
            }
          })}
          </tbody>
        </table>
      )}
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

export default Leaderboard