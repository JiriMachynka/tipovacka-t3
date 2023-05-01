import { type ReactElement } from "react"
import SingleTournamentNavigation from "./SingleTournamentNavigation"

const SingleTournamentLayout = ({ tournamentAuthor, currentUserId, children }: { tournamentAuthor: string, currentUserId: string, children: ReactElement}) => {
  return (
    <main className="min-h-screen bg-[#11132b] text-slate-50">
      <div className="flex flex-col gap-5 lg:max-w-screen-lg lg:mx-auto w-full pt-5">
        <SingleTournamentNavigation tournamentAuthor={tournamentAuthor} currentUserId={currentUserId} />
        {children}
      </div>
    </main>
  )
}
export default SingleTournamentLayout