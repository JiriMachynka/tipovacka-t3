import SingleTournamentLayout from "@/components/SingleTournamentLayout";
import { type GetServerSidePropsContext } from "next";
import { api } from "~/utils/api";

export const SingleTournamentPage = ({ id }: { id : string }) => {
  const { data: tournamentData } = api.tournament.getTournamentById.useQuery({ tournamentId: id });

  if (!tournamentData) return null

  return (
    <SingleTournamentLayout>
      <h1 className="text-center text-4xl font-semibold">{tournamentData.name}</h1>
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

export default SingleTournamentPage;