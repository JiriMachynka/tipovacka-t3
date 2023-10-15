import { z } from "zod";
import { clerkClient } from "@clerk/nextjs/server";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";
import { Teams, Tournaments, Players, TournamentOverallTips, TournamentMatchTips, Users, UserMatchTips, Scorer } from "@/db/schema";
import { and, eq, or, sql } from "drizzle-orm";
import type { TournamentOverallTipsSQL, UserMatchTip } from "@/types";

export const tournamentRouter = createTRPCRouter({
  createTournament: protectedProcedure
    .input(z.object({
      tournamentName: z.string(),
      teams: z.array(z.array(z.string())),
      players: z.array(z.string()),
    }))
    .mutation(async ({ ctx, input }) => {
      const { tournamentName, players, teams } = input;

        const createdTournament = await ctx.db
          .insert(Tournaments)
          .values({
            name: tournamentName,
            authorId: ctx.userId,
          }).returning({ id: Tournaments.id})

        await ctx.db
          .insert(Teams)
          .values(
            teams.map((group, idx) => group.map(team => {
              return {
                name: team,
                groupName: `Skupina ${String.fromCharCode(65 + idx)}`,
                tournamentId: createdTournament[0]?.id as number,
              };
            })).flatMap(group => group)
          );

        if (players.length === 0) {
          const tournamentOverallTip = await ctx.db
            .insert(TournamentOverallTips)
            .values({ tournamentId: createdTournament[0]?.id as number  })
            .returning({ id: TournamentOverallTips.id });
  
          await ctx.db
            .insert(Players)
            .values({
              userId: ctx.userId,
              tournamentId: createdTournament[0]?.id as number,
              tournamentOverallTipId: tournamentOverallTip[0]?.id as number,
            });
        } else {
          const allPlayers = await clerkClient.users.getUserList();
          const currentUsers = allPlayers.filter(player => players.includes(player.username as string));

          currentUsers.map(async player => {
            const tournamentOverallTip = await ctx.db
              .insert(TournamentOverallTips)
              .values({ tournamentId: createdTournament[0]?.id as number })
              .returning({ id: TournamentOverallTips.id });

            await ctx.db
              .insert(Players)
              .values({
                userId: player.id,
                tournamentId: createdTournament[0]?.id as number,
                tournamentOverallTipId: tournamentOverallTip[0]?.id as number,
              })
          })
        }
        return createdTournament[0]?.id as number;
    }),
  addPlayer: protectedProcedure
    .input(z.object({
      tournamentId: z.number(),
      username: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { tournamentId, username } = input;

      const user = await ctx.db
        .select({ id: Users.id })
        .from(Users)
        .where(eq(Users.username, username));

      if (user[0]?.id) {
        const tournamentOverallTip = await ctx.db
          .insert(TournamentOverallTips)
          .values({ tournamentId })
          .returning({ id: TournamentOverallTips.id });

        const player = await ctx.db
          .insert(Players)
          .values({
            userId: user[0].id,
            tournamentId,
            tournamentOverallTipId: tournamentOverallTip[0]?.id as number,
          })
          .returning({ id: Players.id });

        const matchTips = await ctx.db
          .select({
            id: TournamentMatchTips.id,
          })
          .from(TournamentMatchTips)
          .where(eq(TournamentMatchTips.tournamentId, tournamentId));

        if (matchTips.length > 0) {
          await ctx.db
          .insert(UserMatchTips)
          .values(
            matchTips.map(matchTip => {
              return {
                playerId: player[0]?.id as number,
                tournamentMatchTipId: matchTip.id,
              };
            })
          );
        }
        return username;
      }
      return null;
    }),
  getAllTournaments: publicProcedure
    .query(async ({ ctx }) => {
      if (ctx.userId) {
        const allTournaments = await ctx.db
          .select({
            id: Tournaments.id,
            name: Tournaments.name,
          })
          .from(Tournaments)
          .leftJoin(Players, eq(Tournaments.id, Players.tournamentId))
          .where(
            or(
              eq(Tournaments.authorId, ctx.userId),
              eq(Players.userId, ctx.userId),
            )
          );
        return allTournaments;
      }
      return [];
    }),
  getAllTournamentData: protectedProcedure
    .input(z.object({
      tournamentId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const { tournamentId } = input;

      const data = await ctx.db
        .select({
          authorId: Tournaments.authorId,
          name: Tournaments.name,
          username: Users.username,
        })
        .from(Tournaments)
        .leftJoin(Players, eq(Players.tournamentId, Tournaments.id))
        .leftJoin(Users, eq(Players.userId, Users.id))
        .where(eq(Tournaments.id, tournamentId));

      const { rows: userMatches } = await ctx.db.execute(sql`
        SELECT
          user_match_tips.id as "Id",
          home_team.name as "homeTeamName",
          away_team.name as "awayTeamName",
          user_match_tips.home_score as "homeScore",
          user_match_tips.away_score as "awayScore"
        FROM user_match_tips
        LEFT JOIN tournament_match_tips ON user_match_tips.tournament_match_tip_id = tournament_match_tips.id
        LEFT JOIN tournaments ON tournament_match_tips.tournament_id = tournaments.id
        LEFT JOIN teams as home_team ON tournament_match_tips.home_team_id = home_team.id
        LEFT JOIN teams as away_team ON tournament_match_tips.away_team_id = away_team.id
        WHERE tournament_match_tips.locked = true AND tournament_match_tips.tournament_id = ${tournamentId};
      `);

      return {
        data,
        userMatches: userMatches as UserMatchTip[]
      };
    }),
  getTournamentPlayers: protectedProcedure
    .input(z.object({
      tournamentId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const { tournamentId } = input;

      const players = await ctx.db
        .select({
          id: Players.id,
          playerId: Players.userId,
          username: Users.username,
          email: Users.email,
        })
        .from(Players)
        .leftJoin(Users, eq(Players.userId, Users.id))
        .where(eq(Players.tournamentId, tournamentId));
      return players;
    }),
  getTournamentOverallTips: protectedProcedure
    .query(async ({ ctx }) => {
      // TODO: Make it safer, refactor in the future
      const { rows } = await ctx.db.execute(sql.raw(`
        SELECT
          winner.name as "winnerName",
          finalist.name as "finalistName",
          semifinalistFirst.name as "semifinalistFirstName",
          semifinalistSecond.name as "semifinalistSecondName"
        FROM players
        LEFT JOIN tournament_overall_tips ON players.tournament_overall_tip_id = tournament_overall_tips.id
        LEFT JOIN teams AS winner ON tournament_overall_tips.winner_id = winner.id
        LEFT JOIN teams AS finalist ON tournament_overall_tips.finalist_id = finalist.id
        LEFT JOIN teams AS semifinalistFirst ON tournament_overall_tips.semifinalist_first_id = semifinalistFirst.id
        LEFT JOIN teams AS semifinalistSecond ON tournament_overall_tips.semifinalist_second_id = semifinalistSecond.id
        WHERE players.user_id = '${ctx.userId}';
      `));

      return rows[0] as TournamentOverallTipsSQL;
    }),
  updateTournamentOverallTips: protectedProcedure
    .input(z.object({
      tournamentId: z.number(),
      winnerId: z.number(),
      finalistId: z.number(),
      semifinalistFirstId: z.number(),
      semifinalistSecondId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { tournamentId, winnerId, finalistId, semifinalistFirstId, semifinalistSecondId } = input;

      const player = await ctx.db
        .select({ id: Players.id })
        .from(Players)
        .where(and(
          eq(Players.tournamentId, tournamentId),
          eq(Players.userId, ctx.userId),
        ));

      await ctx.db
        .update(TournamentOverallTips)
        .set({
          winnerId,
          finalistId,
          semifinalistFirstId,
          semifinalistSecondId,
        })
        .where(and(
          eq(Players.tournamentOverallTipId, TournamentOverallTips.id),
          eq(Players.id, player[0]?.id as number),
        ));
    }),
  getScorers: protectedProcedure
    .input(z.object({
      tournamentId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const { tournamentId } = input;
      const scorers = await ctx.db
        .select()
        .from(Scorer)
        .where(eq(Scorer.tournamentId, tournamentId));

      return scorers;
    }),
  updateScorer: protectedProcedure
    .input(z.object({
      id: z.number(),
      goals: z.number(),
      assists: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, goals, assists } = input;

      await ctx.db
        .update(Scorer)
        .set({
          goals,
          assists,
        })
        .where(eq(Scorer.id, id));
    }),
  deletePlayer: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id } = input;

      const player = await ctx.db
        .select({ tournamentOverallTipId: Players.tournamentOverallTipId })
        .from(Players)
        .where(eq(Players.id, id));

      await ctx.db
        .delete(TournamentOverallTips)
        .where(eq(TournamentOverallTips.id, player[0]?.tournamentOverallTipId as number));

      await ctx.db
        .delete(UserMatchTips)
        .where(eq(UserMatchTips.playerId, id));

      await ctx.db
        .delete(Players)
        .where(eq(Players.id, id));
    }),
})