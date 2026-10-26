import { Complaint, RecurringProblemArea, Category } from '../types';
import { calculateDistanceMeters } from './geo';

/**
 * Identifies recurring civic problem hotspots based on spatial proximity, category, and frequency
 */
export function analyzeRepeatProblems(complaints: Complaint[]): RecurringProblemArea[] {
  const hotspots: RecurringProblemArea[] = [];
  const processedComplaintIds = new Set<string>();

  // Filter out rejected complaints
  const validComplaints = complaints.filter((c) => c.status !== 'Rejected');

  for (let i = 0; i < validComplaints.length; i++) {
    const primary = validComplaints[i];
    if (processedComplaintIds.has(primary.id)) continue;

    // Cluster all complaints within 250 meters of the primary complaint and same category
    const cluster: Complaint[] = [primary];
    processedComplaintIds.add(primary.id);

    for (let j = 0; j < validComplaints.length; j++) {
      if (i === j) continue;
      const other = validComplaints[j];
      if (processedComplaintIds.has(other.id)) continue;

      if (other.category === primary.category) {
        const dist = calculateDistanceMeters(
          primary.latitude,
          primary.longitude,
          other.latitude,
          other.longitude
        );

        if (dist <= 300) {
          cluster.push(other);
          processedComplaintIds.add(other.id);
        }
      }
    }

    // Only flag as recurring if 2 or more complaints exist in this cluster
    if (cluster.length >= 2) {
      // Calculate recurrence period
      const timestamps = cluster
        .map((c) => new Date(c.created_at).getTime())
        .sort((a, b) => a - b);
      const spanDays = Math.max(
        1,
        Math.round((timestamps[timestamps.length - 1] - timestamps[0]) / (1000 * 60 * 60 * 24))
      );

      let riskLevel: 'Moderate' | 'High' | 'Severe' = 'Moderate';
      if (cluster.length >= 4) {
        riskLevel = 'Severe';
      } else if (cluster.length === 3) {
        riskLevel = 'High';
      }

      // Compute centroid location
      const avgLat = cluster.reduce((sum, c) => sum + c.latitude, 0) / cluster.length;
      const avgLng = cluster.reduce((sum, c) => sum + c.longitude, 0) / cluster.length;

      const recommendation = generateMunicipalRecommendation(primary.category, cluster.length);
      const rootCause = generateRootCause(primary.category, cluster.length, spanDays);

      hotspots.push({
        id: `HOTSPOT-${primary.category.toUpperCase().slice(0, 3)}-${i + 1}`,
        category: primary.category,
        latitude: Number(avgLat.toFixed(6)),
        longitude: Number(avgLng.toFixed(6)),
        address: primary.address,
        complaint_count: cluster.length,
        recurrence_period: `${cluster.length} complaints recorded within ${Math.max(spanDays, 14)} days`,
        risk_level: riskLevel,
        complaint_ids: cluster.map((c) => c.id),
        last_updated: new Date(timestamps[timestamps.length - 1]).toISOString(),
        root_cause_analysis: rootCause,
        recommendation: recommendation,
      });
    }
  }

  // Sort by complaint count descending
  return hotspots.sort((a, b) => b.complaint_count - a.complaint_count);
}

function generateRootCause(category: Category, count: number, days: number): string {
  switch (category) {
    case 'Road Damage':
      return `Multiple pothole resurfacing failures (${count} incidents in ${days} days). Sub-grade moisture seepage and heavy axle commercial traffic causing rapid asphalt breakdown.`;
    case 'Garbage Management':
      return `Insufficient bin capacity and missed morning collection cycles leading to persistent overflow and community dumping around perimeter.`;
    case 'Water Leakage':
      return `High pressure surges in aging ductile iron pipeline. Repetitive joint gasket failures near junction valve.`;
    case 'Drainage Issues':
      return `Structural sediment accumulation and storm inlet blockage causing reverse overflow whenever rainfall exceeds 15mm/hr.`;
    case 'Streetlight Problems':
      return `Corroded underground feeder cable causing intermittent phase trip across consecutive light poles.`;
    default:
      return `Repeated civic distress reports indicating chronic infrastructure maintenance lag in this municipal zone.`;
  }
}

function generateMunicipalRecommendation(category: Category, count: number): string {
  switch (category) {
    case 'Road Damage':
      return count >= 3
        ? 'Commission full 200m asphalt milling and sub-base reconstruction tender instead of temporary cold-mix patching.'
        : 'Deploy infrared hot-mix asphalt patching team and improve roadside storm drainage.';
    case 'Garbage Management':
      return 'Install twin 1100-liter secondary waste compactors, add evening collection route, and mount CCTV civic surveillance.';
    case 'Water Leakage':
      return 'Replace 60m corroded distribution segment with high-density polyethylene (HDPE) PN16 pipe and install pressure relief valve.';
    case 'Drainage Issues':
      return 'Perform mechanized desilting of stormwater culvert, repair curb inlets, and install non-return flap valves.';
    case 'Streetlight Problems':
      return 'Rewire sector underground conduit, upgrade to IP66 surge-protected 90W LED fixtures, and install automated feeder pillar.';
    default:
      return 'Escalate to Zonal Municipal Commissioner for coordinated inter-departmental site inspection.';
  }
}
