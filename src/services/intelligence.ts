import { WasteType } from '../types';

/**
 * Unit V: Classification
 * Simulates image analysis to classify waste.
 */
export const classifyWaste = (imageName: string): { type: WasteType; priority: number; rewardPoints: number } => {
  const types: WasteType[] = ['Plastic', 'Organic', 'Metal', 'Paper', 'Hazardous'];
  const randomIndex = Math.floor(Math.random() * types.length);
  const type = types[randomIndex];
  const priority = Math.floor(Math.random() * 10) + 1;
  const rewardPoints = priority * 10;

  return { type, priority, rewardPoints };
};

/**
 * Unit II: Constraint Satisfaction Problem (CSP)
 * Logic check: Cleaner dept must match waste type.
 */
export const validateAssignment = (cleanerDept: WasteType, wasteType: WasteType): boolean => {
  return cleanerDept === wasteType;
};

/**
 * Unit IV: Probabilistic Models
 * Bayesian Probability simulation for overflow likelihood.
 */
export const getBayesianProbability = (location: string): number => {
  // Mock logic: higher probability near transit hubs
  const transitHubs = ['Kalupur', 'Gita Mandir', 'Airport'];
  const isNearHub = transitHubs.some(hub => location.includes(hub));
  return isNearHub ? 88 : Math.floor(Math.random() * 40) + 20;
};
