export type UserRole = 'citizen' | 'admin' | 'officer';

export type Category =
  | 'Road Damage'
  | 'Garbage Management'
  | 'Water Leakage'
  | 'Drainage Issues'
  | 'Streetlight Problems'
  | 'Public Safety'
  | 'Other Civic Issues';

export type Severity = 'Low' | 'Medium' | 'High' | 'Critical';
export type PriorityLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export type ComplaintStatus =
  | 'Submitted'
  | 'Under Review'
  | 'Assigned'
  | 'In Progress'
  | 'Resolved'
  | 'Rejected';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: UserRole;
  department?: string;
  avatar_url?: string;
  created_at: string;
}

export interface Complaint {
  id: string;
  user_id: string;
  user_name: string;
  user_phone: string;
  title: string;
  description: string;
  category: Category;
  image_url: string;
  latitude: number;
  longitude: number;
  address: string;
  severity: Severity;
  public_safety_risk: boolean;
  priority_score: number;
  priority_level: PriorityLevel;
  status: ComplaintStatus;
  assigned_department: string;
  assigned_officer: string | null;
  assigned_officer_name?: string | null;
  deadline: string; // ISO String
  resolved_at: string | null;
  resolution_proof_url: string | null;
  resolution_notes: string | null;
  created_at: string;
  support_count: number;
  supporters: string[]; // user IDs
  is_escalated: boolean;
  escalation_reason: string | null;
}

export interface ComplaintSupport {
  id: string;
  complaint_id: string;
  user_id: string;
  user_name: string;
  created_at: string;
}

export interface ComplaintUpdate {
  id: string;
  complaint_id: string;
  updated_by_id: string;
  updated_by_name: string;
  role: UserRole;
  status: ComplaintStatus;
  remarks: string;
  proof_url?: string | null;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  complaint_id?: string;
  title: string;
  message: string;
  type: 'status_change' | 'sla_warning' | 'escalation' | 'duplicate_support' | 'resolved';
  is_read: boolean;
  created_at: string;
}

export interface RecurringProblemArea {
  id: string;
  category: Category;
  latitude: number;
  longitude: number;
  address: string;
  complaint_count: number;
  recurrence_period: string;
  risk_level: 'Moderate' | 'High' | 'Severe';
  complaint_ids: string[];
  last_updated: string;
  root_cause_analysis: string;
  recommendation: string;
}

export interface AIPredictionResult {
  source: string;
  category: Category;
  problemTitle: string;
  problemDescription: string;
  suggestedDepartment: string;
  estimatedSeverity: Severity;
  publicSafetyRisk: boolean;
  urgencyPoints: number;
  recommendedAction: string;
  confidenceScore: number;
}
