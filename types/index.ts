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

export type Match = {
  id: number
  date: Date
  homeTeamId: number
  homeTeamName: string
  homeTeamGroupName: string
  awayTeamId: number
  awayTeamName: string
  awayTeamGroupName: string
  homeScore: number
  awayScore: number
  played: boolean
  locked: boolean
}

export type Scorers = {
  scorerFirstFirstName: string
  scorerFirstLastName: string
  scorerSecondFirstName: string
  scorerSecondLastName: string
}

export type TournamentOverallTipsSQL = {
  winnerName: string
  finalistName: string
  semifinalistFirstName: string
  semifinalistSecondName: string
}

export type PlayerMatches = {
  id: number
  date: Date
  homeTeamId: number
  homeTeamName: string
  homeTeamGroupName: string
  awayTeamId: number
  awayTeamName: string
  awayTeamGroupName: string
  homeScore: number
  awayScore: number
  played: boolean
  locked: boolean
}

export type TournamentMatchTip = {
  id: number
  homeTeamName: string
  awayTeamName: string
}

export type UserMatchTip = {
  id: number
  name: string
  username: string
  homeTeamName: string
  awayTeamName: string
  homeScore: number
  awayScore: number
}