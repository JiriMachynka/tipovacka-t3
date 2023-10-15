export type EditedMatch = {
  matchId: number;
  date: string;
  group: string;
  homeTeamId: number;
  homeTeamName: string;
  awayTeamId: number;
  awayTeamName: string;
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
  id: number;
  username: string | null | undefined;
} | null;