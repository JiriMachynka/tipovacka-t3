import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const teamsRouter = createTRPCRouter({
  getGroups: publicProcedure
  .input(z.object({
    tournamentId: z.number(),
  }))
  .query(async ({ ctx, input }) => {
    const { tournamentId } = input;
    const teams = await ctx.prisma.team.findMany({
      where: {
        tournamentId,
      },
      orderBy: {
        groupName: "asc",
      },
      select: {
        groupName: true,
      },
      distinct: ["groupName"]
    })
    return teams;
  }),
  getSortedTeams: publicProcedure
    .input(z.object({
      tournamentId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const { tournamentId } = input;
      const teams = await ctx.prisma.team.findMany({
        where: {
          tournamentId,
        },
        orderBy: {
          groupName: "asc",
        },
      })
      return teams;
    }),
});
