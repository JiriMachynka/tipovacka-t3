import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const playersRouter = createTRPCRouter({
  getPlayer: publicProcedure
    .input(z.object({
      tournamentId: z.number(),
      username: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const { tournamentId, username } = input;
      const player = await ctx.prisma.tournament.findUnique({
        where: {
          id: tournamentId,
        },
        include: {
          players: {
            where: {
              username,
            },
          },
        },
        
      });
      return player;
    }),
  getOverallTips: publicProcedure
    .input(z.object({
      playerId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const { playerId } = input;
      const tournamentOverallTip = await ctx.prisma.player.findUnique({
        where: {
          id: playerId,
        },
        include: {
          tournamentOverallTips: true,
        }
      })
      return tournamentOverallTip;
    }),
  updateOverallTips: publicProcedure
    .input(z.object({
      tournamentId: z.number(),
      winnerId: z.number(),
      semifinalistFirstId: z.number(),
      semifinalistSecondId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { tournamentId, winnerId, semifinalistFirstId, semifinalistSecondId } = input;
      await ctx.prisma.player.update({
        where: { id: tournamentId },
        data: {
          tournamentOverallTips: {
            upsert: {
              create: {
                tournamentId,
                winnerId,
                semifinalistFirstId,
                semifinalistSecondId,
              },
              update: {
                tournamentId,
                winnerId,
                semifinalistFirstId,
                semifinalistSecondId,
              }
            }
          }
        }
      });
    })
});
