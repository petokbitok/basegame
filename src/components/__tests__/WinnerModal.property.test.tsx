import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import fc from 'fast-check';
import { WinnerModal, type WinnerResult } from '../WinnerModal';

/**
 * Property 11: Winner Display Completeness
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4
 * 
 * For any hand result, the winner display should show all required information:
 * winner name(s), hand ranking description, and pot amount(s).
 */
describe('Feature: poker-game-ui, Property 11: Winner Display Completeness', () => {
  it('should display all winner information for single winner', () => {
    fc.assert(
      fc.property(
        fc.record({
          playerId: fc.hexaString({ minLength: 3, maxLength: 10 }),
          playerName: fc.stringOf(fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 '.split('')), { minLength: 3, maxLength: 20 }),
          handRanking: fc.constantFrom('High Card', 'Pair', 'Two Pair', 'Three of a Kind', 'Straight', 'Flush', 'Full House', 'Four of a Kind', 'Straight Flush', 'Royal Flush'),
          potAmount: fc.integer({ min: 100, max: 10000 }),
        }),
        (winner) => {
          const { unmount } = render(
            <WinnerModal winners={[winner]} onClose={vi.fn()} />
          );

          // Should display winner name (trimmed)
          const trimmedName = winner.playerName.trim();
          if (trimmedName.length > 0) {
            expect(screen.getByText(trimmedName)).toBeInTheDocument();
          }
          
          // Should display hand ranking
          expect(screen.getByText(winner.handRanking)).toBeInTheDocument();
          
          // Should display pot amount (formatted)
          const potText = screen.getByText(new RegExp(winner.potAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')));
          expect(potText).toBeInTheDocument();

          unmount();
        }
      ),
      { numRuns: 50 } // Reduced for faster tests
    );
  });

  it('should display all winners for split pot', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            playerId: fc.hexaString({ minLength: 3, maxLength: 10 }),
            playerName: fc.stringOf(fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 '.split('')), { minLength: 3, maxLength: 20 }),
            handRanking: fc.constantFrom('Pair', 'Two Pair', 'Straight'),
            potAmount: fc.integer({ min: 100, max: 5000 }),
          }),
          { minLength: 2, maxLength: 3 }
        ),
        (winners) => {
          const { unmount, container } = render(
            <WinnerModal winners={winners} onClose={vi.fn()} />
          );

          // Should display "Split Pot!" for multiple winners
          const splitPotElements = container.querySelectorAll('h2');
          const hasSplitPot = Array.from(splitPotElements).some(el => el.textContent === 'Split Pot!');
          expect(hasSplitPot).toBe(true);

          // Should display all winner names (trimmed)
          winners.forEach(winner => {
            const trimmedName = winner.playerName.trim();
            if (trimmedName.length > 0) {
              expect(screen.getByText(trimmedName)).toBeInTheDocument();
            }
          });

          unmount();
        }
      ),
      { numRuns: 30 } // Reduced for faster tests
    );
  });

  it('should show confetti for human player wins', () => {
    fc.assert(
      fc.property(
        fc.record({
          playerId: fc.constant('human'),
          playerName: fc.constant('You'),
          handRanking: fc.constantFrom('Pair', 'Flush', 'Full House'),
          potAmount: fc.integer({ min: 100, max: 10000 }),
        }),
        (winner) => {
          const { container, unmount } = render(
            <WinnerModal winners={[winner]} onClose={vi.fn()} />
          );

          // Should have confetti container for human wins
          const confettiContainer = container.querySelector('.confetti-container');
          expect(confettiContainer).toBeInTheDocument();

          unmount();
        }
      ),
      { numRuns: 50 }
    );
  });
});
