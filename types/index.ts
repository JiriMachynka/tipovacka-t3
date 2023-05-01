export type TEditedMatch = {
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

export type TEditedScorer = {
  id: number;
  firstName: string;
  lastName: string;
  goals: number;
  assists: number;
} | null;