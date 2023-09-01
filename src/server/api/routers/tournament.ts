import { z } from "zod";
import { clerkClient } from "@clerk/nextjs/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { Teams, Tournaments, Players, TournamentOverallTips, TournamentMatchTips, Users, UserMatchTips, Scorer } from "@/db/schema";
import { and, eq, or } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

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
  getAllTournaments: protectedProcedure
    .query(async ({ ctx }) => {
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

      return allTournaments || [];
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

      const homeTeam = alias(Teams, "home_team");
      const awayTeam = alias(Teams, "away_team");

      const userMatches = await ctx.db
        .select({
          id: UserMatchTips.id,
          homeTeamName: homeTeam.name,
          awayTeamName: awayTeam.name,
          homeScore: UserMatchTips.homeScore,
          awayScore: UserMatchTips.awayScore,
        })
        .from(UserMatchTips)
        .leftJoin(TournamentMatchTips, eq(UserMatchTips.tournamentMatchTipId, TournamentMatchTips.id))
        .leftJoin(Tournaments, eq(TournamentMatchTips.tournamentId, Tournaments.id))
        .leftJoin(homeTeam, eq(TournamentMatchTips.homeTeamId, homeTeam.id))
        .leftJoin(awayTeam, eq(TournamentMatchTips.awayTeamId, awayTeam.id))
        .where(and(
          eq(TournamentMatchTips.locked, true),
          eq(TournamentMatchTips.tournamentId, tournamentId),
        ));

      return {
        data,
        userMatches,
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
      const winner = alias(Teams, "winner");
      const finalist = alias(Teams, "finalist");
      const semifinalistFirst = alias(Teams, "semifinalist_first");
      const semifinalistSecond = alias(Teams, "semifinalist_second");

      const tournamentOverallTips = await ctx.db
        .select({
          winnerName: winner.name,
          finalistName: finalist.name,
          semifinalistFirstName: semifinalistFirst.name,
          semifinalistSecondName: semifinalistSecond.name,
        })
        .from(Players)
        .leftJoin(TournamentOverallTips, eq(Players.tournamentOverallTipId, TournamentOverallTips.id))
        .leftJoin(winner, eq(TournamentOverallTips.winnerId, winner.id))
        .leftJoin(finalist, eq(TournamentOverallTips.finalistId, finalist.id))
        .leftJoin(semifinalistFirst, eq(TournamentOverallTips.semifinalistFirstId, semifinalistFirst.id))
        .leftJoin(semifinalistSecond, eq(TournamentOverallTips.semifinalistSecondId, semifinalistSecond.id))
        .where(eq(Players.userId, ctx.userId));

      return tournamentOverallTips[0];
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