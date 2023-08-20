import { pgTable, varchar, timestamp, boolean, serial, integer } from "drizzle-orm/pg-core";

export const Users = pgTable("users", {
  id: varchar("id", { length: 256 }).primaryKey(),
  email: varchar("email", { length: 256 }).notNull(),
  username: varchar("username", { length: 256 }).notNull(),
});

export const Tournaments = pgTable("tournaments", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  authorId: varchar("author_id", { length: 255 }).notNull().references(() => Users.id),
  playoff: boolean("playoff").notNull().default(false),
});

export const Players = pgTable("players", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  tournamentId: integer("tournament_id").notNull().references(() => Tournaments.id),
  tournamentOverallTipId: integer("tournament_overall_tip_id").notNull().references(() => TournamentOverallTips.id),
  scorerFirstId: integer("scorer_first_id").references(() => Scorer.id),
  scorerSecondId: integer("scorer_second_id").references(() => Scorer.id),
});

export const Teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  groupName: varchar("group_name", { length: 255 }).notNull(),
  tournamentId: integer("tournament_id").notNull().references(() => Tournaments.id),
});

export const TournamentOverallTips = pgTable("tournament_overall_tips", {
  id: serial("id").primaryKey(),
  tournamentId: integer("tournament_id").notNull().references(() => Tournaments.id),
  winnerId: integer("winner_id").references(() => Teams.id),
  finalistId: integer("finalist_id").references(() => Teams.id),
  semifinalistFirstId: integer("semifinalist_first_id").references(() => Teams.id),
  semifinalistSecondId: integer("semifinalist_second_id").references(() => Teams.id),
});

export const UserMatchTips = pgTable("user_match_tips", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => Players.id),
  tournamentMatchTipId: integer("tournament_match_tip_id").notNull().references(() => TournamentMatchTips.id),
  homeScore: integer("home_score").default(0).notNull(),
  awayScore: integer("away_score").default(0).notNull(),
  points: integer("points"),
});

export const TournamentMatchTips = pgTable("tournament_match_tips", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  tournamentId: integer("tournament_id").notNull().references(() => Tournaments.id),
  homeTeamId: integer("home_team_id").notNull().references(() => Teams.id),
  awayTeamId: integer("away_team_id").notNull().references(() => Teams.id),
  homeScore: integer("home_score").default(0),
  awayScore: integer("away_score").default(0),
  played: boolean("played").default(false),
  locked: boolean("locked").default(false),
});

export const Scorer = pgTable("scorer", {
  id: serial("id").primaryKey(),
  tournamentId: integer("tournament_id").notNull().references(() => Tournaments.id),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  goals: integer("goals").default(0),
  assists: integer("assists").default(0),
});