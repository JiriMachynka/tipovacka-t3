export type EditedMatch = {
  matchId: number;
  date: string;
  group: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamId: number;
  awayTeamId: number;
  homeScore: number;
  awayScore: number;
} | null;

export type EditedScorer = {
  id: number;
  firstName: string;
  lastName: string;
  goals: number;
  assists: number;
} | null;

export type DeletedPlayer = {
  id: string | null | undefined;
  username: string | null | undefined;
} | null;