import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import _ from "lodash";
import { clerkClient } from "@clerk/nextjs/server";
import { UserMatchTip } from "@prisma/client";

export const playersRouter = createTRPCRouter({
  createScorer: protectedProcedure
    .input(z.object({
      tournamentId: z.number(),
      scorerFirstFirstName: z.string(),
      scorerFirstLastName: z.string(),
      scorerSecondFirstName: z.string(),
      scorerSecondLastName: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { tournamentId, scorerFirstFirstName, scorerFirstLastName, scorerSecondFirstName, scorerSecondLastName } = input;
      const currentPlayer = await ctx.prisma.player.findFirst({
        where: {
          playerId: ctx.auth.userId,
        }
      });
      const scorerFirstFound = await ctx.prisma.scorer.findFirst({
        where: {
          firstName: scorerFirstFirstName,
          lastName: scorerFirstLastName,
          tournamentId,
        }
      });
      const scorerFirst = await ctx.prisma.scorer.upsert({
        where: {
          id: scorerFirstFound?.id || await ctx.prisma.scorer.count() + 1,
        },
        create: {
          firstName: scorerFirstFirstName,
          lastName: scorerFirstLastName,
          tournamentId,
        },
        update: {
          firstName: scorerFirstFirstName,
          lastName: scorerFirstLastName,
        }
      });
      const scorerSecondFound = await ctx.prisma.scorer.findFirst({
        where: {
          firstName: scorerSecondFirstName,
          lastName: scorerSecondLastName,
          tournamentId,
        }
      });
      const scorerSecond = await ctx.prisma.scorer.upsert({
        where: {
          id: scorerSecondFound?.id || await ctx.prisma.scorer.count() + 1,
        },
        create: {
          firstName: scorerSecondFirstName,
          lastName: scorerSecondLastName,
          tournamentId,
        },
        update: {
          firstName: scorerSecondFirstName,
          lastName: scorerSecondLastName,
        }
      }); 

      await ctx.prisma.player.update({
        where: {
          id: currentPlayer!.id,
        },
        data: {
          scorerFirstId: scorerFirst.id,
          scorerSecondId: scorerSecond.id,
        }
      });
    }),
  getPlayerScorers: protectedProcedure
    .input(z.object({
      tournamentId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const { tournamentId } = input;
      const scorers = await ctx.prisma.player.findFirst({
        where: {
          playerId: ctx.auth.userId,
          tournamentId: tournamentId
        },
        include: {
          scorerFirst: true,
          scorerSecond: true,
        }
      });
      return scorers;
    }),
  getLeaderboardData: protectedProcedure
    .input(z.object({
      tournamentId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const { tournamentId } = input;
      const leaderboard = await ctx.prisma.player.findMany({
        where: {
          tournamentId,
        },
        include: {
          matchTips: true,
        },
      });
      if (leaderboard[0]?.matchTips.length) {
        const leaderboardData = _.groupBy(leaderboard.map(user => user.matchTips).flat(), "playerId");
        const users = await clerkClient.users.getUserList();
        const tournamentPlayers = await ctx.prisma.player.findMany({
          where: {
            tournamentId,
          }
        });
        return _.sortBy(Object.keys(leaderboardData).map(playerId => {
          return leaderboardData[playerId]?.reduce((prev, curr) => {
            return {
              ...curr,
              points: (prev.points || 0) + (curr.points || 0),
            }
          });
        }).map(matchTip => {
          const user = users.find(user => user?.id === tournamentPlayers.find(player => player?.id === matchTip?.playerId)?.playerId);
          return {
            ...matchTip,
            username: user!.username,
          }
        }), ["points"]).reverse();
      }
      return 
    }),
});
