import { clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { type Player } from "@prisma/client";

export const tournamentRouter = createTRPCRouter({
  createTournament: protectedProcedure
    .input(z.object({
      tournamentName: z.string(),
      teams: z.array(z.array(z.string())),
      players: z.array(z.string()),
    }))
    .mutation(async ({ ctx, input }) => {
      const { tournamentName, players, teams } = input;
      const allPlayers = await clerkClient.users.getUserList();
      const currentUsers = allPlayers.filter(player => players.includes(player.username as string));
      const tournament = await ctx.prisma.tournament.create({
        data: {
          authorId: ctx.auth.userId,
          name: tournamentName,
          teams: {
            createMany: {
              data: teams.map((group, idx) => group.map(team => {
                return {
                  groupName: `Skupina ${String.fromCharCode(65 + idx)}`,
                  name: team,
                };
              })).flatMap(group => group)
            }
          },
          players: {
            createMany: {
              data: currentUsers.map(player => {
                return {
                  id: player.id,
                };
              }),
            }
          }
        },
        include: {
          players: true,
        }
      });
      await ctx.prisma.tournamentOverallTips.createMany({
        data: tournament.players.map((player: Player) => {
          return {
            playerId: player.id,
            tournamentId: player.tournamentId,
          };
        }),
      });
    }),
  addPlayer: protectedProcedure
    .input(z.object({
      tournamentId: z.number(),
      username: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { tournamentId, username } = input;
      const user = (await clerkClient.users.getUserList()).filter(user => user.username === username)[0];
      const player = await ctx.prisma.player.create({
        data: {
          id: user?.id as string,
          tournamentId,
        }
      });
      await ctx.prisma.tournamentOverallTips.create({
        data: {
          playerId: player.id,
          tournamentId,
        }
      });
      const matchTips = await ctx.prisma.tournamentMatchTip.findMany({
        where: {
          tournamentId,
        }
      });
      await ctx.prisma.userMatchTip.createMany({
        data: matchTips.map(matchTip => {
          return {
            playerId: player.id,
            tournamentMatchTipId: matchTip.id,
          };
        })
      });
      return username;
    }),
  getAllTournaments: protectedProcedure
    .query(async ({ ctx }) => {
      const allTournaments = await ctx.prisma.tournament.findMany({
        where: {
          OR: [
            {
              authorId: ctx.auth.userId,
            },
            {
              players: {
                some: {
                  id: ctx.auth.userId,
                }
              }
            }
          ]
        },
        include: {
          players: true,
        }
      });
      return allTournaments;
    }),
  getAllTournamentData: protectedProcedure
    .input(z.object({
      tournamentId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const { tournamentId } = input;
      const tournamentData = await ctx.prisma.tournament.findFirst({
        where: {
          id: tournamentId
        },
        include: {
          teams: true,
          tournamentMatchTips: {
            where: {
              locked: true,
            },
            include: {
              userMatchTip: true,
              homeTeam: true,
              awayTeam: true,
            }
          },
          players: true,
        }
      });
      const usernames = await clerkClient.users.getUserList();
      const playerArr = tournamentData?.players.map(player => {
        const username = usernames.find(username => username.id === player.id)?.username;
        return {
          ...player,
          username
        }
      });
      return {
        ...tournamentData, 
        players: playerArr,
      };
    }),
  getTournamentById: protectedProcedure
    .input(z.object({
      tournamentId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const { tournamentId } = input;
      const tournament = await ctx.prisma.tournament.findUnique({
        where: {
          id: tournamentId,
        },
        include: {
          teams: true,
          players: true,
        },
      });
      return tournament;
    }),
  getTournamentPlayers: protectedProcedure
    .input(z.object({
      tournamentId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const { tournamentId } = input;
      const players = await ctx.prisma.player.findMany({
        where: {
          tournamentId,
        },
        select: {
          id: true,
        }
      });

      const allUsers = await clerkClient.users.getUserList();
      const playerData = players.map(player => allUsers.filter(user => user.id === player.id)[0]);
      return playerData;
    }),
  getTournamentOverallTips: protectedProcedure
    .input(z.object({
      tournamentId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const { tournamentId } = input;
      const tournamentOverallTips = await ctx.prisma.tournamentOverallTips.findFirst({
        where: {
          tournamentId,
          playerId: ctx.auth.userId,
        },
        include: {
          winner: true,
          semifinalistFirst: true,
          semifinalistSecond: true,
        }
      });
      return tournamentOverallTips;
    }),
  updateTournamentOverallTips: protectedProcedure
    .input(z.object({
      tournamentId: z.number(),
      winnerId: z.number(),
      semifinalistFirstId: z.number(),
      semifinalistSecondId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { tournamentId, winnerId, semifinalistFirstId, semifinalistSecondId } = input;
      const userTournamentOverallTip = await ctx.prisma.tournamentOverallTips.findFirst({
        where: {
          tournamentId,
          playerId: ctx.auth.userId,
        }
      });
      await ctx.prisma.tournamentOverallTips.update({
        where: {
          id: userTournamentOverallTip?.id,
        },
        data: {
          winnerId,
          semifinalistFirstId,
          semifinalistSecondId,
        }
      });
    }),
  getScorers: protectedProcedure
    .input(z.object({
      tournamentId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const { tournamentId } = input;
      const scorers = await ctx.prisma.scorer.findMany({
        where: {
          tournamentId,
        },
      });
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
      await ctx.prisma.scorer.update({
        where: {
          id
        },
        data: {
          goals,
          assists,
        }
      })
    }),
  deletePlayer: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id } = input;
      await ctx.prisma.player.delete({
        where: {
          id,
        }
      })
    }),
})