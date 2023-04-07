import { createTRPCRouter } from "~/server/api/trpc";
import { tournamentRouter } from "~/server/api/routers/tournament";
import { userRouter } from "./routers/users";
import { matchesRouter } from "./routers/matches";
import { teamsRouter } from "./routers/teams";
import { playersRouter } from "./routers/players";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  players: playersRouter,
  teams: teamsRouter,
  tournament: tournamentRouter,
  users: userRouter,
  matches: matchesRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
