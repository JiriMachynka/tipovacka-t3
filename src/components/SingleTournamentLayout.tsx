import { type ReactElement } from "react"
import SingleTournamentNavigation from "./SingleTournamentNavigation"

const SingleTournamentLayout = ({ children }: { children: ReactElement }) => {
  return (
    <main className="min-h-screen bg-primary text-slate-50">
      <div className="flex flex-col gap-5 px-3 lg:px-0 lg:max-w-screen-lg lg:mx-auto w-full pt-5">
        <SingleTournamentNavigation />
        {children}
      </div>
    </main>
  )
}
export default SingleTournamentLayout