// Core data types for poker game

export enum Suit {
  HEARTS = 'HEARTS',
  DIAMONDS = 'DIAMONDS',
  CLUBS = 'CLUBS',
  SPADES = 'SPADES'
}

export enum Rank {
  TWO = 2,
  THREE = 3,
  FOUR = 4,
  FIVE = 5,
  SIX = 6,
  SEVEN = 7,
  EIGHT = 8,
  NINE = 9,
  TEN = 10,
  JACK = 11,
  QUEEN = 12,
  KING = 13,
  ACE = 14
}

export interface Card {
  rank: Rank;
  suit: Suit;
}

export enum HandType {
  HIGH_CARD = 0,
  PAIR = 1,
  TWO_PAIR = 2,
  THREE_OF_A_KIND = 3,
  STRAIGHT = 4,
  FLUSH = 5,
  FULL_HOUSE = 6,
  FOUR_OF_A_KIND = 7,
  STRAIGHT_FLUSH = 8,
  ROYAL_FLUSH = 9
}

export interface HandRank {
  type: HandType;
  primaryRank: number;
  kickers: number[];
  strength: number;
}

export enum ActionType {
  FOLD = 'FOLD',
  CHECK = 'CHECK',
  CALL = 'CALL',
  BET = 'BET',
  RAISE = 'RAISE'
}

export interface PlayerAction {
  type: ActionType;
  amount?: number;
  playerId: string;
}

export enum Position {
  SMALL_BLIND = 'SMALL_BLIND',
  BIG_BLIND = 'BIG_BLIND',
  EARLY = 'EARLY',
  MIDDLE = 'MIDDLE',
  LATE = 'LATE',
  DEALER = 'DEALER'
}

export interface Player {
  id: string;
  name: string;
  chipStack: number;
  holeCards: Card[];
  currentBet: number;
  position: Position;
  isActive: boolean;
  isAllIn: boolean;
  lastAction: PlayerAction | null;
  baseAddress?: string;
  isHuman: boolean;
}

export interface SidePot {
  amount: number;
  eligiblePlayers: string[];
}

export interface PotState {
  mainPot: number;
  sidePots: SidePot[];
  totalPot: number;
}

export enum GameStage {
  PRE_FLOP = 'PRE_FLOP',
  FLOP = 'FLOP',
  TURN = 'TURN',
  RIVER = 'RIVER',
  SHOWDOWN = 'SHOWDOWN'
}

export interface HandRecord {
  handNumber: number;
  winner: string;
  potSize: number;
  winningHand: HandRank;
  timestamp: number;
}

export interface GameState {
  players: Player[];
  communityCards: Card[];
  pot: PotState;
  currentStage: GameStage;
  dealerPosition: number;
  activePlayer: number;
  bettingRound: number;
  handHistory: HandRecord[];
  authenticatedUser: UserIdentity | null;
}

export interface UserIdentity {
  fid: number;
  address: string;
  username?: string;
}

export interface PlayerStats {
  address: string;
  points: number;
  gamesWon: number;
  handsWon: number;
  biggestPot: number;
  lastActive: number;
}

export interface LeaderboardEntry {
  player: string;
  points: number;
  gamesWon: number;
  handsWon: number;
  rank: number;
}
