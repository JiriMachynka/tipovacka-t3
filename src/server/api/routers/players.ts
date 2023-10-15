import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { and, eq, sql } from "drizzle-orm";
import { Users, Players, UserMatchTips, Scorer } from "@/db/schema";
import { alias } from "drizzle-orm/pg-core";

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
      
      const scorerFirst = await ctx.db
        .select({
          id: Scorer.id,
        })
        .from(Scorer)
        .where(and(
          eq(Scorer.firstName, scorerFirstFirstName),
          eq(Scorer.lastName, scorerFirstLastName),
          eq(Scorer.tournamentId, tournamentId),
        ))
      
      if (!scorerFirst[0]?.id) {
        await ctx.db
          .insert(Scorer)
          .values({
            firstName: scorerFirstFirstName,
            lastName: scorerFirstLastName,
            tournamentId,
          });
      }

      const scorerSecond = await ctx.db
        .select({
          id: Scorer.id,
        })
        .from(Scorer)
        .where(and(
          eq(Scorer.firstName, scorerSecondFirstName),
          eq(Scorer.lastName, scorerSecondLastName),
          eq(Scorer.tournamentId, tournamentId),
        ))
      
      if (!scorerSecond[0]?.id) {
        await ctx.db
          .insert(Scorer)
          .values({
            firstName: scorerSecondFirstName,
            lastName: scorerSecondLastName,
            tournamentId,
          });
      }

      await ctx.db
        .update(Players)
        .set({
          scorerFirstId: scorerFirst[0]?.id,
          scorerSecondId: scorerSecond[0]?.id,
        })
        .where(eq(Players.tournamentId, tournamentId));
    }),
  getPlayerScorers: protectedProcedure
    .input(z.object({
      tournamentId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const { tournamentId } = input;

      const scorerFirst = alias(Scorer, "scorer_first");
      const scorerSecond = alias(Scorer, "scorer_second");

      const scorers = await ctx.db
        .select({
          scorerFirstFirstName: scorerFirst.firstName,
          scorerFirstLastName: scorerFirst.lastName,
          scorerSecondFirstName: scorerSecond.firstName,
          scorerSecondLastName: scorerSecond.lastName,
        })
        .from(Players)
        .leftJoin(scorerFirst, eq(Players.scorerFirstId, scorerFirst.id))
        .leftJoin(scorerSecond, eq(Players.scorerSecondId, scorerSecond.id))
        .where(eq(Players.tournamentId, tournamentId));

      return scorers[0];
    }),
  getLeaderboardData: protectedProcedure
    .input(z.object({
      tournamentId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const { tournamentId } = input;
    
      const leaderboard = await ctx.db
        .select({
          username: Users.username,
          points: sql<number>`SUM(user_match_tips.points)`,
        })
        .from(UserMatchTips)
        .leftJoin(Players, eq(UserMatchTips.playerId, Players.id))
        .leftJoin(Users, eq(Players.userId, Users.id))
        .where(eq(Players.tournamentId, tournamentId))
        .groupBy(Users.username);

      return leaderboard;
    }),
});
