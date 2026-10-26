import { Category, Complaint } from '../types';

/**
 * Calculates great-circle distance between two GPS coordinates using the Haversine formula.
 * @returns distance in meters
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Computes token-based Jaccard similarity between two text strings
 */
export function computeTextSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0;
  
  const tokenize = (str: string) => {
    return new Set(
      str
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter((w) => w.length > 2)
    );
  };

  const setA = tokenize(text1);
  const setB = tokenize(text2);

  if (setA.size === 0 || setB.size === 0) return 0;

  let intersectionCount = 0;
  for (const token of setA) {
    if (setB.has(token)) {
      intersectionCount++;
    }
  }

  const unionSize = new Set([...setA, ...setB]).size;
  return unionSize > 0 ? intersectionCount / unionSize : 0;
}

export interface DuplicateMatch {
  complaint: Complaint;
  distanceMeters: number;
  textSimilarityScore: number;
  overallMatchScore: number; // 0 - 100%
  matchReason: string;
}

/**
 * Identifies potential duplicate complaints based on distance, category, and text content
 */
export function findPotentialDuplicates(
  newComplaint: {
    title: string;
    description: string;
    category: Category;
    latitude: number;
    longitude: number;
  },
  existingComplaints: Complaint[],
  maxDistanceMeters: number = 500
): DuplicateMatch[] {
  const matches: DuplicateMatch[] = [];

  for (const item of existingComplaints) {
    // Only check active (unresolved or recently resolved) complaints
    if (item.status === 'Rejected') continue;

    const distance = calculateDistanceMeters(
      newComplaint.latitude,
      newComplaint.longitude,
      item.latitude,
      item.longitude
    );

    if (distance > maxDistanceMeters) continue;

    const combinedNewText = `${newComplaint.title} ${newComplaint.description}`;
    const combinedExistingText = `${item.title} ${item.description}`;
    const textScore = computeTextSimilarity(combinedNewText, combinedExistingText);
    const categoryMatch = newComplaint.category === item.category;

    // Weight factors:
    // Distance proximity: closer means higher score (0m = 100%, 500m = 0%)
    const distanceScore = Math.max(0, (maxDistanceMeters - distance) / maxDistanceMeters);
    const categoryFactor = categoryMatch ? 0.35 : 0.05;
    const textFactor = textScore * 0.45;
    const distanceFactor = distanceScore * 0.20;

    const overallScore = Math.min(
      100,
      Math.round((categoryFactor + textFactor + distanceFactor) * 100)
    );

    // Criteria for potential duplicate:
    // Either very close (< 200m) with same category, OR text match > 35% within maxDistance
    if (
      (distance <= 250 && categoryMatch) ||
      (categoryMatch && textScore > 0.25) ||
      overallScore >= 40
    ) {
      let reason = '';
      if (categoryMatch && distance <= 150) {
        reason = `Same category within ${distance}m`;
      } else if (textScore > 0.3) {
        reason = `High problem description similarity (${Math.round(textScore * 100)}%) nearby`;
      } else {
        reason = `Geographic proximity (${distance}m) in related domain`;
      }

      matches.push({
        complaint: item,
        distanceMeters: distance,
        textSimilarityScore: Math.round(textScore * 100),
        overallMatchScore: overallScore,
        matchReason: reason,
      });
    }
  }

  // Sort by match score descending
  return matches.sort((a, b) => b.overallMatchScore - a.overallMatchScore);
}
