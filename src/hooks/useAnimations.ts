import { useState } from 'react';

export type AnimationType = 'card-deal' | 'chip-move' | 'winner-reveal';

/**
 * Hook for managing animation states and timing
 */
export function useAnimations() {
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState<AnimationType | null>(null);

  /**
   * Animate card dealing with staggered timing
   * @param count - Number of cards to deal
   */
  const animateCardDeal = async (count: number) => {
    setIsAnimating(true);
    setCurrentAnimation('card-deal');
    
    // Stagger card animations by 100ms each
    await new Promise(resolve => setTimeout(resolve, count * 100));
    
    setIsAnimating(false);
    setCurrentAnimation(null);
  };

  /**
   * Animate chip movement to/from pot
   */
  const animateChipMovement = async () => {
    setIsAnimating(true);
    setCurrentAnimation('chip-move');
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setIsAnimating(false);
    setCurrentAnimation(null);
  };

  /**
   * Animate winner reveal
   */
  const animateWinnerReveal = async () => {
    setIsAnimating(true);
    setCurrentAnimation('winner-reveal');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsAnimating(false);
    setCurrentAnimation(null);
  };

  return {
    isAnimating,
    currentAnimation,
    animateCardDeal,
    animateChipMovement,
    animateWinnerReveal,
  };
}
