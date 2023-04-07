import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const matchesRouter = createTRPCRouter({
  createMatch: publicProcedure
    .input(z.object({
      date: z.date(),
      tournamentId: z.number(),
      homeTeamId: z.number(),
      awayTeamId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { date, tournamentId, homeTeamId, awayTeamId } = input;
      const players = await ctx.prisma.player.findMany({
        where: {
          tournamentId,
        }
      });
      await ctx.prisma.tournamentMatchTip.create({
        data: {
          date,
          tournamentId,
          homeTeamId,
          awayTeamId,
          userMatchTip: {
            createMany: {
              data: players.map(player => {
                return {
                  playerId: player.id,
                };
              }),
            }
          }
        },
      });
    }),
  getMatches: publicProcedure
    .input(z.object({
      tournamentId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const { tournamentId } = input;
      const matches = await ctx.prisma.tournamentMatchTip.findMany({
        where: {
          tournamentId,
        },
        orderBy: {
          date: "desc",
        },
        include: {
          homeTeam: true,
          awayTeam: true,
        }
      });
      return matches;
    }
  ),
  updateMatch: publicProcedure
    .input(z.object({
      tournamentId: z.number(),
      matchId: z.number(),
      date: z.date(),
      homeTeam: z.string(),
      awayTeam: z.string(),
      homeScore: z.number(),
      awayScore: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { tournamentId, matchId, date, homeTeam: homeTeamName, awayTeam: awayTeamName, homeScore, awayScore } = input;
      const homeTeam = await ctx.prisma.team.findFirst({
        where: {
          tournamentId,
          name: homeTeamName,
        }
      });
      const awayTeam = await ctx.prisma.team.findFirst({
        where: {
          name: awayTeamName,
        }
      });
      await ctx.prisma.tournamentMatchTip.update({
        where: {
          id: matchId,
        },
        data: {
          date,
          homeTeamId: homeTeam?.id,
          awayTeamId: awayTeam?.id,
          homeScore,
          awayScore,
        },
      });
    }),
  deleteMatch: publicProcedure
    .input(z.object({
      matchId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { matchId } = input;
      await ctx.prisma.tournamentMatchTip.delete({
        where: {
          id: matchId,
        },
      });
    }
  ),
  lockMatch: publicProcedure
    .input(z.object({
      matchId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { matchId } = input;
      await ctx.prisma.tournamentMatchTip.update({
        where: {
          id: matchId,
        },
        data: {
          locked: true,
        },
      });
    }),
  unlockMatch: publicProcedure
    .input(z.object({
      matchId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { matchId } = input;
      await ctx.prisma.tournamentMatchTip.update({
        where: {
          id: matchId,
        },
        data: {
          locked: false,
        },
      });
    }),
});
