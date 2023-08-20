import { z } from "zod";
import { Players, TournamentMatchTips, UserMatchTips } from "@/db/schema";
import type { PlayerMatches, Match } from "@/types";
import { sql, and, eq } from "drizzle-orm";
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

      const players = await ctx.db
        .select({ playerId: Players.id })
        .from(Players)
        .where(eq(Players.tournamentId, tournamentId));

      const tournamentMatchTip = await ctx.db
        .insert(TournamentMatchTips)
        .values({
          date,
          tournamentId,
          homeTeamId,
          awayTeamId,
        })
        .returning({ id: TournamentMatchTips.id });

      players.map(async player => {
        await ctx.db
          .insert(UserMatchTips)
          .values({
            playerId: player.playerId,
            tournamentMatchTipId: tournamentMatchTip[0]?.id as number,
          });
      });
    }),
  getMatches: protectedProcedure
    .input(z.object({
      tournamentId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      // TODO: Works completely fine for now, but should be refactored to use the ORM in the future
      const { tournamentId } = input;

      const { rows } = await ctx.db.execute(sql`
        SELECT 
          tournament_match_tips.id,
          tournament_match_tips.date,
          home_team.id as "homeTeamId",
          home_team.name as "homeTeamName",
          home_team.group_name as "homeTeamGroupName",
          away_team.id as "awayTeamId",
          away_team.name as "awayTeamName",
          away_team.group_name as "awayTeamGroupName",
          tournament_match_tips.home_score as "homeScore",
          tournament_match_tips.away_score as "awayScore",
          tournament_match_tips.played,
          tournament_match_tips.locked
        FROM tournament_match_tips
        JOIN teams AS home_team ON tournament_match_tips.home_team_id = home_team.id
        JOIN teams AS away_team ON tournament_match_tips.away_team_id = away_team.id
        WHERE tournament_match_tips.tournament_id = ${tournamentId}
        ORDER BY tournament_match_tips.date ASC;
      `);

      return rows as Match[];
    }
  ),
  getPlayerMatches: protectedProcedure
    .input(z.object({
      tournamentId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const { tournamentId } = input;

      // TODO: Works completely fine for now, but should be refactored to use the ORM in the future
      const player = await ctx.db
        .select({ 
          id: Players.id 
        })
        .from(Players)
        .where(and(
          eq(Players.tournamentId, tournamentId),
          eq(Players.userId, ctx.userId),
        ));

        const { rows } = await ctx.db.execute(sql`
          SELECT 
            user_match_tips.id,
            tournament_match_tips.date,
            home_team.id as "homeTeamId",
            home_team.name as "homeTeamName",
            home_team.group_name as "homeTeamGroupName",
            away_team.id as "awayTeamId",
            away_team.name as "awayTeamName",
            away_team.group_name as "awayTeamGroupName",
            user_match_tips.home_score as "homeScore",
            user_match_tips.away_score as "awayScore",
            tournament_match_tips.played,
            tournament_match_tips.locked
          FROM user_match_tips
          LEFT JOIN tournament_match_tips ON user_match_tips.tournament_match_tip_id = tournament_match_tips.id
          LEFT JOIN teams AS home_team ON tournament_match_tips.home_team_id = home_team.id
          LEFT JOIN teams AS away_team ON tournament_match_tips.away_team_id = away_team.id
          WHERE 
            user_match_tips.player_id = ${player[0]?.id} AND
            tournament_match_tips.locked = true
          ORDER BY tournament_match_tips.date ASC;
        `);

      return rows as PlayerMatches[];
    }),
  updateMatch: publicProcedure
    .input(z.object({
      matchId: z.number(),
      date: z.date(),
      homeTeamId: z.number(),
      awayTeamId: z.number(),
      homeScore: z.number(),
      awayScore: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { matchId, date, homeTeamId, awayTeamId, homeScore, awayScore } = input;

      await ctx.db
        .update(TournamentMatchTips)
        .set({
          date,
          homeTeamId,
          awayTeamId,
          homeScore,
          awayScore,
        })
        .where(eq(TournamentMatchTips.id, matchId));
    }),
  updateUserMatchTip: protectedProcedure
    .input(z.object({
      matchId: z.number(),
      homeScore: z.number(),
      awayScore: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { matchId, homeScore, awayScore } = input;

      await ctx.db
        .update(UserMatchTips)
        .set({
          homeScore,
          awayScore,
        })
        .where(eq(UserMatchTips.id, matchId));
    }),
  deleteMatch: publicProcedure
    .input(z.object({
      matchId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { matchId } = input;

      await ctx.db
        .delete(UserMatchTips)
        .where(eq(UserMatchTips.tournamentMatchTipId, matchId));
      await ctx.db
        .delete(TournamentMatchTips)
        .where(eq(TournamentMatchTips.id, matchId));
    }
  ),
  lockMatch: publicProcedure
    .input(z.object({
      matchId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { matchId } = input;

      // TODO: Make the code more readable 🎉
      // TODO: Also make sure that everything is working as expected
      await ctx.db
        .update(TournamentMatchTips)
        .set({
          locked: true,
          played: false,
        })
        .where(eq(TournamentMatchTips.id, matchId));

      const tournamentMatchTip = await ctx.db
        .select({
          id: TournamentMatchTips.id,
          homeScore: TournamentMatchTips.homeScore,
          awayScore: TournamentMatchTips.awayScore,
        })
        .from(TournamentMatchTips)
        .where(eq(TournamentMatchTips.id, matchId));

      const userMatchTips = await ctx.db
        .select()
        .from(UserMatchTips)
        .where(eq(UserMatchTips.tournamentMatchTipId, tournamentMatchTip[0]!.id));

      const tournamentHomeScore = tournamentMatchTip[0]?.homeScore as number;
      const tournamentAwayScore = tournamentMatchTip[0]?.awayScore as number;

      userMatchTips.map(async (matchTip) => {
        const draw = matchTip.homeScore === matchTip.awayScore && tournamentHomeScore === tournamentAwayScore;
        const homeWin = matchTip.homeScore > matchTip.awayScore && tournamentHomeScore > tournamentAwayScore;
        const awayWin = matchTip.homeScore < matchTip.awayScore && tournamentHomeScore < tournamentAwayScore;

        const exactDraw = 
          (matchTip.homeScore === tournamentHomeScore) && 
          (matchTip.homeScore === matchTip.awayScore && tournamentHomeScore === tournamentAwayScore);

        const exactHomeWin = 
          (matchTip.homeScore === tournamentHomeScore && matchTip.awayScore === tournamentAwayScore) &&
          (matchTip.homeScore > matchTip.awayScore && tournamentHomeScore > tournamentAwayScore);

          const exactAwayWin = 
            (matchTip.homeScore === tournamentHomeScore && matchTip.awayScore === tournamentAwayScore) && 
            (matchTip.homeScore < matchTip.awayScore && tournamentHomeScore < tournamentAwayScore);

        console.log((exactDraw || exactHomeWin || exactAwayWin) ? 3 : (draw || homeWin || awayWin) ? 1 : 0)
        await ctx.db
          .update(UserMatchTips)
          .set({
            points: (exactDraw || exactHomeWin || exactAwayWin) ? 3 : (draw || homeWin || awayWin) ? 1 : 0,
          })
          .where(eq(UserMatchTips.id, matchTip.id));
      });
    }),
  unlockMatch: publicProcedure
    .input(z.object({
      matchId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { matchId } = input;
      await ctx.db
        .update(TournamentMatchTips)
        .set({
          locked: false,
          played: false,
        })
        .where(eq(TournamentMatchTips.id, matchId));

      await ctx.db
        .update(UserMatchTips)
        .set({
          points: null,
        })
        .where(eq(UserMatchTips.tournamentMatchTipId, matchId));
    }),
});
