import { z } from "zod";
import { Teams } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const teamsRouter = createTRPCRouter({
  getGroups: publicProcedure
  .input(z.object({
    tournamentId: z.number(),
  }))
  .query(async ({ ctx, input }) => {
    const { tournamentId } = input;
    const teams = await ctx.db
      .select({
        name: Teams.groupName,
      })
      .from(Teams)
      .where(eq(Teams.tournamentId, tournamentId))
      .orderBy(asc(Teams.groupName))
      .groupBy(Teams.groupName);

    return teams;
  }),
  getSortedTeams: publicProcedure
    .input(z.object({
      tournamentId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const { tournamentId } = input;

      const teams = await ctx.db
        .select({
          id: Teams.id,
          name: Teams.name,
          groupName: Teams.groupName,
        })
        .from(Teams)
        .where(eq(Teams.tournamentId, tournamentId))
        .orderBy(asc(Teams.groupName));

      return teams;
    }),
});
