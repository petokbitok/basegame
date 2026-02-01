import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import fc from 'fast-check';
import { PlayerPosition } from '../PlayerPosition';
import type { Player } from '../../types';
import { Suit, Rank, Position, ActionType } from '../../types';

/**
 * Feature: poker-game-ui
 * Property 4: Player State Indicators
 * 
 * For any player, their current state (chip stack, last action, active/folded/all-in status)
 * should be accurately displayed based on the game state.
 * 
 * **Validates: Requirements 3.1, 3.6, 6.3, 6.4, 6.5**
 */

// Arbitraries for generating test data
const actionTypeArb = fc.constantFrom<ActionType>(
  ActionType.FOLD,
  ActionType.CHECK,
  ActionType.CALL,
  ActionType.BET,
  ActionType.RAISE
);

const playerActionArb = fc.record({
  type: actionTypeArb,
  playerId: fc.constant('test-player'),
  amount: fc.option(fc.integer({ min: 0, max: 10000 }), { nil: undefined }),
});

const playerArb = fc.record({
  id: fc.constant('test-player'),
  name: fc.string({ minLength: 1, maxLength: 20 }),
  chipStack: fc.integer({ min: 0, max: 1000000 }),
  holeCards: fc.constant([
    { rank: Rank.ACE, suit: Suit.SPADES },
    { rank: Rank.KING, suit: Suit.HEARTS },
  ]),
  currentBet: fc.integer({ min: 0, max: 1000 }),
  position: fc.constant(Position.DEALER),
  isActive: fc.boolean(),
  isAllIn: fc.boolean(),
  lastAction: fc.option(playerActionArb, { nil: null }),
  isHuman: fc.boolean(),
});

describe('Feature: poker-game-ui, Property 4: Player State Indicators', () => {
  it('should accurately display chip stack for any player', () => {
    fc.assert(
      fc.property(playerArb, (player) => {
        const { container } = render(
          <PlayerPosition
            player={player}
            isActive={false}
            isDealer={false}
            position="top"
            isHuman={player.isHuman}
          />
        );

        // Chip stack should be displayed with proper formatting
        const formattedAmount = player.chipStack.toLocaleString('en-US');
        const chipDisplay = container.textContent;
        
        // The chip stack should appear in the component
        expect(chipDisplay).toContain(formattedAmount);
      }),
      { numRuns: 100 }
    );
  });

  it('should accurately display last action for any player', () => {
    fc.assert(
      fc.property(playerArb, (player) => {
        const { container, unmount } = render(
          <PlayerPosition
            player={player}
            isActive={false}
            isDealer={false}
            position="top"
            isHuman={player.isHuman}
          />
        );

        if (player.lastAction) {
          // Action indicator should be present
          const actionIndicator = container.querySelector('[data-testid="action-indicator"]');
          expect(actionIndicator).toBeTruthy();

          // Action type should be displayed
          const actionLabels: Record<ActionType, string> = {
            FOLD: 'Fold',
            CHECK: 'Check',
            CALL: 'Call',
            BET: 'Bet',
            RAISE: 'Raise',
          };
          const expectedLabel = actionLabels[player.lastAction.type];
          expect(container.textContent).toContain(expectedLabel);

          // If action has an amount, it should be displayed
          if (player.lastAction.amount && player.lastAction.amount > 0) {
            const formattedAmount = player.lastAction.amount.toLocaleString('en-US');
            expect(container.textContent).toContain(formattedAmount);
          }
        } else {
          // No action indicator should be present
          const actionIndicator = container.querySelector('[data-testid="action-indicator"]');
          expect(actionIndicator).toBeFalsy();
        }

        unmount();
      }),
      { numRuns: 100 }
    );
  });

  it('should accurately display folded status for any player', () => {
    fc.assert(
      fc.property(playerArb, (player) => {
        const { container, unmount } = render(
          <PlayerPosition
            player={player}
            isActive={false}
            isDealer={false}
            position="top"
            isHuman={player.isHuman}
          />
        );

        const positionElement = container.querySelector('[data-testid="player-position"]');
        expect(positionElement).toBeTruthy();

        if (!player.isActive) {
          // Folded players should be grayed out
          expect(positionElement?.className).toContain('opacity-40');
          expect(positionElement?.className).toContain('grayscale');
        } else {
          // Active players should not be grayed out
          expect(positionElement?.className).not.toContain('opacity-40');
          expect(positionElement?.className).not.toContain('grayscale');
        }

        unmount();
      }),
      { numRuns: 100 }
    );
  });

  it('should accurately display all-in status for any player', () => {
    fc.assert(
      fc.property(playerArb, (player) => {
        const { container, unmount } = render(
          <PlayerPosition
            player={player}
            isActive={false}
            isDealer={false}
            position="top"
            isHuman={player.isHuman}
          />
        );

        const allInBadge = container.querySelector('[data-testid="all-in-badge"]');

        if (player.isAllIn) {
          // All-in badge should be present
          expect(allInBadge).toBeTruthy();
          expect(allInBadge?.textContent).toBe('ALL-IN');
        } else {
          // All-in badge should not be present
          expect(allInBadge).toBeFalsy();
        }

        unmount();
      }),
      { numRuns: 100 }
    );
  });

  it('should accurately display active player highlighting', () => {
    fc.assert(
      fc.property(playerArb, fc.boolean(), (player, isActive) => {
        const { container, unmount } = render(
          <PlayerPosition
            player={player}
            isActive={isActive}
            isDealer={false}
            position="top"
            isHuman={player.isHuman}
          />
        );

        const positionElement = container.querySelector('[data-testid="player-position"]');
        expect(positionElement).toBeTruthy();

        if (isActive) {
          // Active player should have highlight ring
          expect(positionElement?.className).toContain('ring-4');
          expect(positionElement?.className).toContain('ring-yellow-400');
        } else {
          // Inactive player should not have highlight ring
          expect(positionElement?.className).not.toContain('ring-4');
        }

        unmount();
      }),
      { numRuns: 100 }
    );
  });

  it('should display all state indicators simultaneously and correctly', () => {
    fc.assert(
      fc.property(
        playerArb,
        fc.boolean(),
        fc.boolean(),
        (player, isActive, isDealer) => {
          const { container, unmount } = render(
            <PlayerPosition
              player={player}
              isActive={isActive}
              isDealer={isDealer}
              position="top"
              isHuman={player.isHuman}
            />
          );

          // Verify all state indicators are consistent
          const containerElement = container.querySelector('[data-testid="player-position"]');
          expect(containerElement).toBeTruthy();

          // 1. Chip stack is always displayed
          const formattedChips = player.chipStack.toLocaleString('en-US');
          expect(container.textContent).toContain(formattedChips);

          // 2. Active highlighting is correct
          if (isActive) {
            expect(containerElement?.className).toContain('ring-4');
          }

          // 3. Folded styling is correct
          if (!player.isActive) {
            expect(containerElement?.className).toContain('opacity-40');
          }

          // 4. All-in badge is correct
          const allInBadge = container.querySelector('[data-testid="all-in-badge"]');
          if (player.isAllIn) {
            expect(allInBadge).toBeTruthy();
          } else {
            expect(allInBadge).toBeFalsy();
          }

          // 5. Last action is correct
          const actionIndicator = container.querySelector('[data-testid="action-indicator"]');
          if (player.lastAction) {
            expect(actionIndicator).toBeTruthy();
          } else {
            expect(actionIndicator).toBeFalsy();
          }

          // 6. Dealer button is correct
          const dealerButton = container.querySelector('[data-testid="dealer-button"]');
          if (isDealer) {
            expect(dealerButton).toBeTruthy();
          } else {
            expect(dealerButton).toBeFalsy();
          }

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});
