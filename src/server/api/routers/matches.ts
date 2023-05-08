
import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";

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
  getMatches: protectedProcedure
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
          date: "asc",
        },
        include: {
          homeTeam: true,
          awayTeam: true,
        }
      });
      return matches;
    }
  ),
  getPlayerMatches: protectedProcedure
    .query(async ({ ctx }) => {
      const matches = await ctx.prisma.userMatchTip.findMany({
        where: {
          playerId: ctx.auth.userId,
        },
        orderBy: {
          tournamentMatchTip: {
            date: "asc"
          }
        },
        include: {
          tournamentMatchTip: {
            include: {
              homeTeam: true,
              awayTeam: true,
            }
          }
        }
      });
      return matches;
    }),
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
  updateUserMatchTip: protectedProcedure
    .input(z.object({
      matchId: z.number(),
      homeScore: z.number(),
      awayScore: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { matchId, homeScore, awayScore } = input;
      await ctx.prisma.userMatchTip.update({
        where: {
          id: matchId,
        },
        data: {
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
      const deleteUsersMatchTip = ctx.prisma.userMatchTip.deleteMany({
        where: {
          tournamentMatchTipId: matchId,
        }
      });
      const deleteTournamentMatchTip = ctx.prisma.tournamentMatchTip.delete({
        where: {
          id: matchId,
        },
      });
      await ctx.prisma.$transaction([deleteUsersMatchTip, deleteTournamentMatchTip]);
    }
  ),
  lockMatch: publicProcedure
    .input(z.object({
      matchId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { matchId } = input;
      const { id: tournamentMatchTipId, homeScore, awayScore } = await ctx.prisma.tournamentMatchTip.update({
        where: {
          id: matchId,
        },
        data: {
          locked: true,
          played: true,
        },
      });
      const userMatchTips = await ctx.prisma.userMatchTip.findMany({
        where: {
          tournamentMatchTipId,
        },
      });

      userMatchTips.map(async (matchTip) => {
        const draw = matchTip.homeScore === matchTip.awayScore && homeScore === awayScore;
        const homeWin = matchTip.homeScore > matchTip.awayScore && homeScore > awayScore;
        const awayWin = matchTip.homeScore < matchTip.awayScore && homeScore < awayScore;

        const exactDraw = (matchTip.homeScore === homeScore) && (matchTip.homeScore === matchTip.awayScore && homeScore === awayScore);
        const exactHomeWin = (matchTip.homeScore === homeScore && matchTip.awayScore === awayScore) && (matchTip.homeScore > matchTip.awayScore && homeScore > awayScore);
        const exactAwayWin = (matchTip.homeScore === homeScore && matchTip.awayScore === awayScore) && (matchTip.homeScore < matchTip.awayScore && homeScore < awayScore);
        
        await ctx.prisma.userMatchTip.update({
          where: {
            id: matchTip.id,
          },
          data: {
            points: (exactDraw || exactHomeWin || exactAwayWin) ? 3 : (draw || homeWin || awayWin) ? 1 : 0,
          }
        });
      });
    }),
  unlockMatch: publicProcedure
    .input(z.object({
      matchId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { matchId } = input;
      const { id: tournamentMatchTipId } = await ctx.prisma.tournamentMatchTip.update({
        where: {
          id: matchId,
        },
        data: {
          locked: false,
        },
      });

      await ctx.prisma.userMatchTip.updateMany({
        where: {
          tournamentMatchTipId
        },
        data: {
          points: null,
        }
      });
    }),
});
