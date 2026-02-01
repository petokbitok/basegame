import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GameStageIndicator } from '../GameStageIndicator';
import { GameStage } from '../../types';

/**
 * Unit tests for GameStageIndicator component
 * 
 * **Validates: Requirements 6.2, 6.7**
 * 
 * These tests verify specific examples for game stage display:
 * - Stage name display
 * - Current bet display
 * - Display structure and styling
 */
describe('GameStageIndicator Component - Unit Tests', () => {
  describe('Stage name display', () => {
    it('should display "Pre-Flop" for PRE_FLOP stage', () => {
      render(<GameStageIndicator stage={GameStage.PRE_FLOP} currentBet={0} />);
      
      expect(screen.getByText('Pre-Flop')).toBeTruthy();
    });

    it('should display "Flop" for FLOP stage', () => {
      render(<GameStageIndicator stage={GameStage.FLOP} currentBet={0} />);
      
      expect(screen.getByText('Flop')).toBeTruthy();
    });

    it('should display "Turn" for TURN stage', () => {
      render(<GameStageIndicator stage={GameStage.TURN} currentBet={0} />);
      
      expect(screen.getByText('Turn')).toBeTruthy();
    });

    it('should display "River" for RIVER stage', () => {
      render(<GameStageIndicator stage={GameStage.RIVER} currentBet={0} />);
      
      expect(screen.getByText('River')).toBeTruthy();
    });

    it('should display "Showdown" for SHOWDOWN stage', () => {
      render(<GameStageIndicator stage={GameStage.SHOWDOWN} currentBet={0} />);
      
      expect(screen.getByText('Showdown')).toBeTruthy();
    });
  });

  describe('Current bet display', () => {
    it('should display current bet when bet is greater than 0', () => {
      render(<GameStageIndicator stage={GameStage.PRE_FLOP} currentBet={100} />);
      
      expect(screen.getByText('Current Bet:')).toBeTruthy();
      expect(screen.getByText('$100')).toBeTruthy();
    });

    it('should format large bet amounts with commas', () => {
      render(<GameStageIndicator stage={GameStage.FLOP} currentBet={5000} />);
      
      expect(screen.getByText('$5,000')).toBeTruthy();
    });

    it('should format very large bet amounts correctly', () => {
      render(<GameStageIndicator stage={GameStage.TURN} currentBet={123456} />);
      
      expect(screen.getByText('$123,456')).toBeTruthy();
    });

    it('should not display current bet when bet is 0', () => {
      render(<GameStageIndicator stage={GameStage.PRE_FLOP} currentBet={0} />);
      
      expect(screen.queryByText('Current Bet:')).toBeFalsy();
    });

    it('should not display current bet section when bet is 0', () => {
      const { container } = render(
        <GameStageIndicator stage={GameStage.FLOP} currentBet={0} />
      );
      
      // Should not contain the bet display text
      expect(container.textContent).not.toContain('Current Bet:');
    });
  });

  describe('Display structure', () => {
    it('should have proper styling classes', () => {
      const { container } = render(
        <GameStageIndicator stage={GameStage.PRE_FLOP} currentBet={0} />
      );
      
      const indicator = container.firstChild as HTMLElement;
      expect(indicator.className).toContain('rounded-xl');
      expect(indicator.className).toContain('shadow-lg');
    });

    it('should display both stage and bet when bet exists', () => {
      render(<GameStageIndicator stage={GameStage.RIVER} currentBet={250} />);
      
      expect(screen.getByText('River')).toBeTruthy();
      expect(screen.getByText('Current Bet:')).toBeTruthy();
      expect(screen.getByText('$250')).toBeTruthy();
    });
  });

  describe('Edge cases', () => {
    it('should handle small bet amounts', () => {
      render(<GameStageIndicator stage={GameStage.PRE_FLOP} currentBet={10} />);
      
      expect(screen.getByText('$10')).toBeTruthy();
    });

    it('should handle showdown stage with bet', () => {
      render(<GameStageIndicator stage={GameStage.SHOWDOWN} currentBet={500} />);
      
      expect(screen.getByText('Showdown')).toBeTruthy();
      expect(screen.getByText('$500')).toBeTruthy();
    });

    it('should handle all stages with zero bet', () => {
      const stages = [
        GameStage.PRE_FLOP,
        GameStage.FLOP,
        GameStage.TURN,
        GameStage.RIVER,
        GameStage.SHOWDOWN,
      ];

      stages.forEach((stage) => {
        const { container } = render(
          <GameStageIndicator stage={stage} currentBet={0} />
        );
        
        // Should not show bet display
        expect(container.textContent).not.toContain('Current Bet:');
      });
    });

    it('should handle all stages with non-zero bet', () => {
      const stages = [
        GameStage.PRE_FLOP,
        GameStage.FLOP,
        GameStage.TURN,
        GameStage.RIVER,
        GameStage.SHOWDOWN,
      ];

      stages.forEach((stage) => {
        const { container } = render(
          <GameStageIndicator stage={stage} currentBet={100} />
        );
        
        // Should show bet display
        expect(container.textContent).toContain('Current Bet:');
        expect(container.textContent).toContain('$100');
      });
    });
  });
});
