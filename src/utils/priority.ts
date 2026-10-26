import { Category, PriorityLevel, Severity, ComplaintStatus } from '../types';

/**
 * Category hazard baseline weights
 */
const CATEGORY_WEIGHTS: Record<Category, number> = {
  'Public Safety': 30,
  'Road Damage': 25,
  'Water Leakage': 24,
  'Drainage Issues': 25,
  'Streetlight Problems': 18,
  'Garbage Management': 16,
  'Other Civic Issues': 12,
};

/**
 * Severity weights
 */
const SEVERITY_WEIGHTS: Record<Severity, number> = {
  Critical: 35,
  High: 25,
  Medium: 15,
  Low: 8,
};

/**
 * Computes smart priority score (0 - 100) based on:
 * - Issue severity
 * - Public safety risk factor
 * - Category hazard weight
 * - Community impact (number of supporting citizens)
 * - Aging factor (duration of unresolved complaint in hours)
 */
export function calculatePriorityScore(params: {
  category: Category;
  severity: Severity;
  publicSafetyRisk: boolean;
  supportCount: number;
  createdAtISO?: string;
  isResolved?: boolean;
}): { score: number; level: PriorityLevel } {
  const { category, severity, publicSafetyRisk, supportCount, createdAtISO, isResolved } = params;

  let score = 0;

  // 1. Severity weight (8 to 35 pts)
  score += SEVERITY_WEIGHTS[severity] || 15;

  // 2. Category baseline weight (12 to 30 pts)
  score += CATEGORY_WEIGHTS[category] || 15;

  // 3. Immediate public safety risk flag (+15 pts)
  if (publicSafetyRisk) {
    score += 15;
  }

  // 4. Affected citizens / Community support impact (+3 pts per citizen up to +20 pts)
  const supportBonus = Math.min(20, Math.max(0, supportCount) * 3);
  score += supportBonus;

  // 5. Unresolved duration aging factor
  // Escalates +2 pts per 24 hours unresolved up to +15 pts
  if (createdAtISO && !isResolved) {
    const createdTime = new Date(createdAtISO).getTime();
    const now = Date.now();
    const hoursUnresolved = Math.max(0, (now - createdTime) / (1000 * 60 * 60));
    const agingBonus = Math.min(15, Math.floor(hoursUnresolved / 24) * 2.5);
    score += Math.round(agingBonus);
  }

  // Clamp score between 10 and 100
  const finalScore = Math.min(100, Math.max(10, Math.round(score)));

  let level: PriorityLevel = 'Low';
  if (finalScore >= 80) {
    level = 'Critical';
  } else if (finalScore >= 60) {
    level = 'High';
  } else if (finalScore >= 35) {
    level = 'Medium';
  } else {
    level = 'Low';
  }

  return { score: finalScore, level };
}

/**
 * Calculates resolution deadline based on Category and Priority
 */
export function calculateDeadline(category: Category, priority: PriorityLevel, startDate: Date = new Date()): string {
  const deadlineDate = new Date(startDate);

  // Resolution SLA hours based on priority
  let hours = 168; // Default 7 days

  if (priority === 'Critical') {
    // 24 to 36 hours for critical public safety or major hazards
    hours = category === 'Public Safety' || category === 'Water Leakage' ? 24 : 36;
  } else if (priority === 'High') {
    // 3 to 4 days
    hours = 72;
  } else if (priority === 'Medium') {
    // 7 days
    hours = 168;
  } else {
    // Low: 14 days
    hours = 336;
  }

  deadlineDate.setHours(deadlineDate.getHours() + hours);
  return deadlineDate.toISOString();
}

export type DeadlineStatus = 'resolved' | 'overdue' | 'approaching' | 'on_track';

/**
 * Evaluates remaining time and status for a complaint deadline
 */
export function getDeadlineInfo(deadlineISO: string, status: ComplaintStatus) {
  if (status === 'Resolved') {
    return {
      status: 'resolved' as DeadlineStatus,
      label: 'Resolved on time',
      isOverdue: false,
      hoursLeft: 0,
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    };
  }

  if (status === 'Rejected') {
    return {
      status: 'resolved' as DeadlineStatus,
      label: 'Closed',
      isOverdue: false,
      hoursLeft: 0,
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
    };
  }

  const deadline = new Date(deadlineISO).getTime();
  const now = Date.now();
  const diffMs = deadline - now;
  const hoursLeft = Math.round(diffMs / (1000 * 60 * 60));

  if (diffMs < 0) {
    const overdueHours = Math.abs(hoursLeft);
    const overdueDays = Math.floor(overdueHours / 24);
    const label =
      overdueDays > 0
        ? `Overdue by ${overdueDays}d ${overdueHours % 24}h`
        : `Overdue by ${overdueHours}h`;

    return {
      status: 'overdue' as DeadlineStatus,
      label,
      isOverdue: true,
      hoursLeft,
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300 font-semibold',
    };
  }

  if (hoursLeft <= 24) {
    return {
      status: 'approaching' as DeadlineStatus,
      label: `${hoursLeft}h remaining`,
      isOverdue: false,
      hoursLeft,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300 font-medium',
    };
  }

  const daysLeft = Math.floor(hoursLeft / 24);
  const label = daysLeft > 1 ? `${daysLeft} days left` : `${hoursLeft}h left`;

  return {
    status: 'on_track' as DeadlineStatus,
    label,
    isOverdue: false,
    hoursLeft,
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
  };
}

/**
 * Returns badge styling classes for Priority
 */
export function getPriorityBadge(priority: PriorityLevel) {
  switch (priority) {
    case 'Critical':
      return {
        bg: 'bg-red-50 text-red-700 border-red-200 ring-1 ring-red-400/20',
        dot: 'bg-red-500 animate-pulse',
        label: 'Critical',
      };
    case 'High':
      return {
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        dot: 'bg-amber-500',
        label: 'High',
      };
    case 'Medium':
      return {
        bg: 'bg-blue-50 text-blue-700 border-blue-200',
        dot: 'bg-blue-500',
        label: 'Medium',
      };
    case 'Low':
    default:
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
        label: 'Low',
      };
  }
}

/**
 * Returns badge styling classes for Complaint Status
 */
export function getStatusBadge(status: ComplaintStatus) {
  switch (status) {
    case 'Submitted':
      return 'bg-slate-100 text-slate-700 border-slate-300';
    case 'Under Review':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'Assigned':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'In Progress':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Resolved':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Rejected':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-300';
  }
}
