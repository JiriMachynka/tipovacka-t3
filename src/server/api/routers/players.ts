import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { and, eq, sql } from "drizzle-orm";
import { Users, Players, UserMatchTips, Scorer } from "@/db/schema";
import type { Scorers } from "@/types";

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
      // TODO: Works completely fine for now, but should be refactored to use the ORM in the future
      const { tournamentId } = input;

        const { rows } = await ctx.db.execute(sql`
        SELECT 
          scorer_first.first_name AS "scorerFirstFirstName",
          scorer_first.last_name AS "scorerFirstLastName",
          scorer_second.first_name AS "scorerSecondFirstName",
          scorer_second.last_name AS "scorerSecondLastName"
        FROM players
        LEFT JOIN scorer AS scorer_first ON players.scorer_first_id = scorer_first.id
        LEFT JOIN scorer AS scorer_second ON players.scorer_second_id = scorer_second.id
        WHERE players.tournament_id = ${tournamentId};
        `);

      return rows[0] as Scorers;
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
