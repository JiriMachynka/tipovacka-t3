import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

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
          id: ctx.auth.userId
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
          id: ctx.auth.userId,
          tournamentId: tournamentId
        },
        include: {
          scorerFirst: true,
          scorerSecond: true,
        }
      });
      return scorers;
    }),
});
