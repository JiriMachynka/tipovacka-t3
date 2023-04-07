import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const tournamentRouter = createTRPCRouter({
  createTournament: publicProcedure
    .input(
      z.object({
        authorId: z.string(),
        tournamentName: z.string(),
        teams: z.array(z.array(z.string())),
        players: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { tournamentName, players, teams } = input;
      await ctx.prisma.tournament.create({
        data: {
          authorId: input.authorId,
          name: tournamentName,
          teams: {
            createMany: {
              data: teams.map((group, idx) => group.map(team => {
                return {
                  groupName: `Skupina ${String.fromCharCode(65 + idx)}`,
                  name: team,
                };
              })).flatMap(group => group)
            }
          },
          players: {
            createMany: {
              data: players.map(player => {
                return {
                  username: player,
                };
              }),
            }
          }
        }
      });
    }),
  getAllTournaments: publicProcedure
    .query(async ({ ctx }) => {
      const allTournaments = await ctx.prisma.tournament.findMany();
      return allTournaments;
    }),
  getTournamentById: publicProcedure
    .input(z.object({
      tournamentId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const tournament = await ctx.prisma.tournament.findUnique({
        where: {
          id: parseInt(input.tournamentId),
        },
        include: {
          teams: true,
          players: true,
        },
      });
      return tournament;
    }),
});