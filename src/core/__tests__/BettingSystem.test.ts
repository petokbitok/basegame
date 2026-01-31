import { BettingSystem } from '../BettingSystem';
import { Player, PlayerAction, ActionType, Position, PotState } from '../../types';

describe('BettingSystem Unit Tests', () => {
  const bigBlind = 10;
  let bettingSystem: BettingSystem;

  beforeEach(() => {
    bettingSystem = new BettingSystem(bigBlind);
  });

  const createPlayer = (overrides: Partial<Player> = {}): Player => ({
    id: 'player1',
    name: 'Player 1',
    chipStack: 1000,
    holeCards: [],
    currentBet: 0,
    position: Position.MIDDLE,
    isActive: true,
    isAllIn: false,
    lastAction: null,
    isHuman: false,
    ...overrides
  });

  describe('All-in scenarios with multiple players', () => {
    test('should handle all-in with two players correctly', () => {
      const player1 = createPlayer({ id: 'p1', chipStack: 100, currentBet: 100 });
      const player2 = createPlayer({ id: 'p2', chipStack: 0, currentBet: 200 });

      const potState = bettingSystem.calculateSidePots([player1, player2]);

      expect(potState.totalPot).toBe(300);
      expect(potState.mainPot).toBe(200); // Both players contributed 100 each
      expect(potState.sidePots.length).toBe(1);
      expect(potState.sidePots[0].amount).toBe(100); // Player 2's extra 100
      expect(potState.sidePots[0].eligiblePlayers).toEqual(['p2']);
    });

    test('should handle three-way all-in with different stack sizes', () => {
      const player1 = createPlayer({ id: 'p1', currentBet: 50 });
      const player2 = createPlayer({ id: 'p2', currentBet: 100 });
      const player3 = createPlayer({ id: 'p3', currentBet: 200 });

      const potState = bettingSystem.calculateSidePots([player1, player2, player3]);

      expect(potState.totalPot).toBe(350);
      // Main pot: 50 * 3 = 150 (all three players)
      // Side pot 1: 50 * 2 = 100 (player2 and player3)
      // Side pot 2: 100 * 1 = 100 (player3 only)
      expect(potState.mainPot).toBe(150);
      expect(potState.sidePots.length).toBe(2);
    });

    test('should handle multiple all-ins with same bet amount', () => {
      const player1 = createPlayer({ id: 'p1', currentBet: 100 });
      const player2 = createPlayer({ id: 'p2', currentBet: 100 });
      const player3 = createPlayer({ id: 'p3', currentBet: 100 });

      const potState = bettingSystem.calculateSidePots([player1, player2, player3]);

      expect(potState.totalPot).toBe(300);
      expect(potState.mainPot).toBe(300);
      expect(potState.sidePots.length).toBe(0); // No side pots when all equal
    });
  });

  describe('Minimum bet enforcement', () => {
    test('should reject bet below big blind when player has sufficient chips', () => {
      const player = createPlayer({ chipStack: 100 });
      const action: PlayerAction = {
        type: ActionType.BET,
        amount: 5,
        playerId: player.id
      };

      const result = bettingSystem.validateAction(player, action, 0, [player]);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Minimum bet');
    });

    test('should allow all-in bet below big blind', () => {
      const player = createPlayer({ chipStack: 5 });
      const action: PlayerAction = {
        type: ActionType.BET,
        amount: 5,
        playerId: player.id
      };

      const result = bettingSystem.validateAction(player, action, 0, [player]);

      expect(result.valid).toBe(true);
    });

    test('should enforce minimum raise amount', () => {
      const player = createPlayer({ chipStack: 1000, currentBet: 0 });
      const action: PlayerAction = {
        type: ActionType.RAISE,
        amount: 15, // Current bet is 10, raising to 15 (only 5 more)
        playerId: player.id
      };

      const result = bettingSystem.validateAction(player, action, 10, [player]);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Minimum raise');
    });
  });

  describe('Invalid action rejection', () => {
    test('should reject check when there is a bet to call', () => {
      const player = createPlayer({ currentBet: 0 });
      const action: PlayerAction = {
        type: ActionType.CHECK,
        playerId: player.id
      };

      const result = bettingSystem.validateAction(player, action, 10, [player]);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('must call or raise');
    });

    test('should reject call when there is no bet', () => {
      const player = createPlayer({ currentBet: 0 });
      const action: PlayerAction = {
        type: ActionType.CALL,
        playerId: player.id
      };

      const result = bettingSystem.validateAction(player, action, 0, [player]);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('No bet to call');
    });

    test('should reject bet when there is already a bet', () => {
      const player = createPlayer({ currentBet: 0 });
      const action: PlayerAction = {
        type: ActionType.BET,
        amount: 20,
        playerId: player.id
      };

      const result = bettingSystem.validateAction(player, action, 10, [player]);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Use raise instead');
    });

    test('should reject raise when there is no bet', () => {
      const player = createPlayer({ currentBet: 0 });
      const action: PlayerAction = {
        type: ActionType.RAISE,
        amount: 20,
        playerId: player.id
      };

      const result = bettingSystem.validateAction(player, action, 0, [player]);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('use bet instead');
    });
  });

  describe('Pot odds calculation', () => {
    test('should calculate pot odds correctly', () => {
      const potOdds = bettingSystem.calculatePotOdds(100, 20);

      expect(potOdds.potSize).toBe(100);
      expect(potOdds.callAmount).toBe(20);
      expect(potOdds.odds).toBe(5); // 100/20 = 5:1
      expect(potOdds.percentage).toBeCloseTo(16.67, 1); // 20/(100+20) * 100
    });

    test('should handle zero call amount', () => {
      const potOdds = bettingSystem.calculatePotOdds(100, 0);

      expect(potOdds.odds).toBe(0);
      expect(potOdds.percentage).toBe(0);
    });
  });

  describe('Pot distribution', () => {
    test('should distribute entire pot to single winner', () => {
      const pot: PotState = {
        mainPot: 100,
        sidePots: [],
        totalPot: 100
      };

      const winners = [{ playerId: 'p1' }];
      const distribution = bettingSystem.distributePot(winners, pot, []);

      expect(distribution.distributions.get('p1')).toBe(100);
      expect(distribution.totalDistributed).toBe(100);
    });

    test('should split pot evenly between multiple winners', () => {
      const pot: PotState = {
        mainPot: 100,
        sidePots: [],
        totalPot: 100
      };

      const winners = [{ playerId: 'p1' }, { playerId: 'p2' }];
      const distribution = bettingSystem.distributePot(winners, pot, []);

      expect(distribution.distributions.get('p1')).toBe(50);
      expect(distribution.distributions.get('p2')).toBe(50);
      expect(distribution.totalDistributed).toBe(100);
    });

    test('should handle odd chip when splitting pot', () => {
      const pot: PotState = {
        mainPot: 101,
        sidePots: [],
        totalPot: 101
      };

      const winners = [{ playerId: 'p1' }, { playerId: 'p2' }];
      const distribution = bettingSystem.distributePot(winners, pot, []);

      // First winner gets the odd chip
      expect(distribution.distributions.get('p1')).toBe(51);
      expect(distribution.distributions.get('p2')).toBe(50);
      expect(distribution.totalDistributed).toBe(101);
    });
  });

  describe('Betting round completion', () => {
    test('should detect complete betting round when all players matched', () => {
      const players = [
        createPlayer({ id: 'p1', currentBet: 10, lastAction: { type: ActionType.CALL, playerId: 'p1' } }),
        createPlayer({ id: 'p2', currentBet: 10, lastAction: { type: ActionType.BET, amount: 10, playerId: 'p2' } })
      ];

      const isComplete = bettingSystem.isBettingRoundComplete(players);
      expect(isComplete).toBe(true);
    });

    test('should detect incomplete betting round when player has not acted', () => {
      const players = [
        createPlayer({ id: 'p1', currentBet: 10, lastAction: { type: ActionType.BET, amount: 10, playerId: 'p1' } }),
        createPlayer({ id: 'p2', currentBet: 0, lastAction: null })
      ];

      const isComplete = bettingSystem.isBettingRoundComplete(players);
      expect(isComplete).toBe(false);
    });

    test('should consider round complete when only one active player remains', () => {
      const players = [
        createPlayer({ id: 'p1', isActive: true }),
        createPlayer({ id: 'p2', isActive: false })
      ];

      const isComplete = bettingSystem.isBettingRoundComplete(players);
      expect(isComplete).toBe(true);
    });

    test('should consider round complete when all players are all-in', () => {
      const players = [
        createPlayer({ id: 'p1', isAllIn: true }),
        createPlayer({ id: 'p2', isAllIn: true })
      ];

      const isComplete = bettingSystem.isBettingRoundComplete(players);
      expect(isComplete).toBe(true);
    });
  });

  describe('Action processing', () => {
    test('should process fold action correctly', () => {
      const player = createPlayer();
      const pot: PotState = { mainPot: 0, sidePots: [], totalPot: 0 };
      const action: PlayerAction = { type: ActionType.FOLD, playerId: player.id };

      const result = bettingSystem.processAction(player, action, 0, pot);

      expect(result.success).toBe(true);
      expect(result.updatedPlayer.isActive).toBe(false);
      expect(result.updatedPlayer.lastAction).toEqual(action);
    });

    test('should process call action and update pot', () => {
      const player = createPlayer({ chipStack: 100, currentBet: 0 });
      const pot: PotState = { mainPot: 10, sidePots: [], totalPot: 10 };
      const action: PlayerAction = { type: ActionType.CALL, playerId: player.id };

      const result = bettingSystem.processAction(player, action, 10, pot);

      expect(result.success).toBe(true);
      expect(result.updatedPlayer.chipStack).toBe(90);
      expect(result.updatedPlayer.currentBet).toBe(10);
      expect(result.newPot.totalPot).toBe(20);
    });

    test('should mark player all-in when calling with insufficient chips', () => {
      const player = createPlayer({ chipStack: 5, currentBet: 0 });
      const pot: PotState = { mainPot: 10, sidePots: [], totalPot: 10 };
      const action: PlayerAction = { type: ActionType.CALL, playerId: player.id };

      const result = bettingSystem.processAction(player, action, 10, pot);

      expect(result.success).toBe(true);
      expect(result.updatedPlayer.chipStack).toBe(0);
      expect(result.updatedPlayer.currentBet).toBe(5);
      expect(result.updatedPlayer.isAllIn).toBe(true);
      expect(result.newPot.totalPot).toBe(15);
    });
  });

  describe('Reset bets for new round', () => {
    test('should reset all player bets to zero', () => {
      const players = [
        createPlayer({ id: 'p1', currentBet: 50 }),
        createPlayer({ id: 'p2', currentBet: 100 }),
        createPlayer({ id: 'p3', currentBet: 75 })
      ];

      const resetPlayers = bettingSystem.resetBetsForNewRound(players);

      resetPlayers.forEach(player => {
        expect(player.currentBet).toBe(0);
      });
    });
  });
});
