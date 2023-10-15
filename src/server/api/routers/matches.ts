import { z } from "zod";
import { Players, Teams, TournamentMatchTips, UserMatchTips } from "@/db/schema";
import { and, eq, asc } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";
import { alias } from "drizzle-orm/pg-core";

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
      const { tournamentId } = input;

      const homeTeam = alias(Teams, "home_team");
      const awayTeam = alias(Teams, "away_team");

      const matches = await ctx.db
        .select({
          id: TournamentMatchTips.id,
          date: TournamentMatchTips.date,
          homeTeamId: homeTeam.id,
          homeTeamName: homeTeam.name,
          homeTeamGroupName: homeTeam.groupName,
          awayTeamId: awayTeam.id,
          awayTeamName: awayTeam.name,
          awayTeamGroupName: awayTeam.groupName,
          homeScore: TournamentMatchTips.homeScore,
          awayScore: TournamentMatchTips.awayScore,
          played: TournamentMatchTips.played,
          locked: TournamentMatchTips.locked,
        })
        .from(TournamentMatchTips)
        .leftJoin(homeTeam, eq(TournamentMatchTips.homeTeamId, homeTeam.id))
        .leftJoin(awayTeam, eq(TournamentMatchTips.awayTeamId, awayTeam.id))
        .where(eq(TournamentMatchTips.tournamentId, tournamentId))
        .orderBy(asc(TournamentMatchTips.date));

      return matches;
    }
  ),
  getPlayerMatches: protectedProcedure
    .input(z.object({
      tournamentId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const { tournamentId } = input;

      const player = await ctx.db
        .select({ 
          id: Players.id 
        })
        .from(Players)
        .where(and(
          eq(Players.tournamentId, tournamentId),
          eq(Players.userId, ctx.userId),
        ));

      const homeTeam = alias(Teams, "home_team");
      const awayTeam = alias(Teams, "away_team");

      const matches = await ctx.db
        .select({
          id: TournamentMatchTips.id,
          date: TournamentMatchTips.date,
          homeTeamId: homeTeam.id,
          homeTeamName: homeTeam.name,
          homeTeamGroupName: homeTeam.groupName,
          awayTeamId: awayTeam.id,
          awayTeamName: awayTeam.name,
          awayTeamGroupName: awayTeam.groupName,
          homeScore: UserMatchTips.homeScore,
          awayScore: UserMatchTips.awayScore,
          played: TournamentMatchTips.played,
          locked: TournamentMatchTips.locked,
        })
        .from(TournamentMatchTips)
        .leftJoin(UserMatchTips, eq(UserMatchTips.tournamentMatchTipId, TournamentMatchTips.id))
        .leftJoin(homeTeam, eq(TournamentMatchTips.homeTeamId, homeTeam.id))
        .leftJoin(awayTeam, eq(TournamentMatchTips.awayTeamId, awayTeam.id))
        .where(and(
          eq(UserMatchTips.playerId, player[0]?.id as number),
          eq(TournamentMatchTips.tournamentId, tournamentId)
        ))
        .orderBy(asc(TournamentMatchTips.date));

      return matches;
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
