import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Complaint,
  UserProfile,
  ComplaintUpdate,
  NotificationItem,
  RecurringProblemArea,
  AIPredictionResult,
  ComplaintStatus,
  Category,
  Severity,
} from '../types';
import {
  INITIAL_PROFILES,
  INITIAL_COMPLAINTS,
  INITIAL_UPDATES,
  INITIAL_NOTIFICATIONS,
} from '../data/mockData';
import { calculatePriorityScore, calculateDeadline } from '../utils/priority';
import { analyzeRepeatProblems } from '../utils/hotspots';
import { findPotentialDuplicates, DuplicateMatch } from '../utils/geo';

interface CivicContextType {
  currentUser: UserProfile;
  allUsers: UserProfile[];
  setCurrentUser: (user: UserProfile) => void;
  switchRole: (role: 'citizen' | 'admin' | 'officer', officerDept?: string) => void;

  complaints: Complaint[];
  updates: ComplaintUpdate[];
  notifications: NotificationItem[];
  hotspots: RecurringProblemArea[];

  // Actions
  createComplaint: (data: {
    title: string;
    description: string;
    category: Category;
    image_url: string;
    latitude: number;
    longitude: number;
    address: string;
    severity: Severity;
    public_safety_risk?: boolean;
    assigned_department?: string;
  }) => Promise<Complaint>;

  supportExistingComplaint: (complaintId: string) => Promise<boolean>;

  updateComplaintStatus: (
    complaintId: string,
    newStatus: ComplaintStatus,
    remarks: string,
    options?: {
      assigned_department?: string;
      assigned_officer?: string | null;
      assigned_officer_name?: string | null;
      resolution_proof_url?: string | null;
      resolution_notes?: string | null;
    }
  ) => Promise<boolean>;

  escalateComplaint: (complaintId: string, reason: string) => Promise<boolean>;

  checkDuplicates: (params: {
    title: string;
    description: string;
    category: Category;
    latitude: number;
    longitude: number;
  }) => DuplicateMatch[];

  analyzeWithAI: (params: {
    imageBase64?: string;
    mimeType?: string;
    descriptionText?: string;
  }) => Promise<AIPredictionResult>;

  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  // System reset for demo purposes
  resetToDemoData: () => void;

  // Toast notification
  toast: { message: string; type: 'success' | 'error' | 'info' | 'warning' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

const CivicContext = createContext<CivicContextType | undefined>(undefined);

const STORAGE_KEY_COMPLAINTS = 'civicconnect_complaints_v1';
const STORAGE_KEY_UPDATES = 'civicconnect_updates_v1';
const STORAGE_KEY_NOTIFS = 'civicconnect_notifs_v1';
const STORAGE_KEY_USER = 'civicconnect_active_user_v1';

export const CivicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allUsers] = useState<UserProfile[]>(INITIAL_PROFILES);
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_USER);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return INITIAL_PROFILES[0]; // Sarah Jenkins (Citizen)
  });

  const [complaints, setComplaints] = useState<Complaint[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_COMPLAINTS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return INITIAL_COMPLAINTS;
  });

  const [updates, setUpdates] = useState<ComplaintUpdate[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_UPDATES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return INITIAL_UPDATES;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_NOTIFS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return INITIAL_NOTIFICATIONS;
  });

  const [hotspots, setHotspots] = useState<RecurringProblemArea[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_COMPLAINTS, JSON.stringify(complaints));
  }, [complaints]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_UPDATES, JSON.stringify(updates));
  }, [updates]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(currentUser));
  }, [currentUser]);

  // Recalculate recurring problem hotspots whenever complaints list updates
  useEffect(() => {
    const calculated = analyzeRepeatProblems(complaints);
    setHotspots(calculated);
  }, [complaints]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const switchRole = (role: 'citizen' | 'admin' | 'officer', officerDept?: string) => {
    if (role === 'citizen') {
      setCurrentUser(INITIAL_PROFILES[0]);
      showToast('Switched to Citizen persona: Sarah Jenkins', 'info');
    } else if (role === 'admin') {
      setCurrentUser(INITIAL_PROFILES[2]);
      showToast('Switched to Administrator: Commissioner Rajesh Verma', 'info');
    } else {
      if (officerDept?.includes('Solid') || officerDept?.includes('Waste')) {
        setCurrentUser(INITIAL_PROFILES[4]);
        showToast('Switched to Officer: Maya Patel (Solid Waste Mgmt)', 'info');
      } else if (officerDept?.includes('Water')) {
        setCurrentUser(INITIAL_PROFILES[5]);
        showToast('Switched to Officer: Marcus Brody (Water Supply)', 'info');
      } else {
        setCurrentUser(INITIAL_PROFILES[3]);
        showToast('Switched to Officer: Eng. David Chen (PWD)', 'info');
      }
    }
  };

  const createComplaint = async (data: {
    title: string;
    description: string;
    category: Category;
    image_url: string;
    latitude: number;
    longitude: number;
    address: string;
    severity: Severity;
    public_safety_risk?: boolean;
    assigned_department?: string;
  }): Promise<Complaint> => {
    const newId = `CC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowISO = new Date().toISOString();
    const safetyRisk = data.public_safety_risk ?? (data.severity === 'Critical');

    // Smart Priority calculation
    const { score, level } = calculatePriorityScore({
      category: data.category,
      severity: data.severity,
      publicSafetyRisk: safetyRisk,
      supportCount: 1, // Author is initial supporter
      createdAtISO: nowISO,
      isResolved: false,
    });

    // Smart Deadline calculation
    const deadlineISO = calculateDeadline(data.category, level, new Date());

    // Suggested department mapping
    let department = data.assigned_department;
    if (!department) {
      switch (data.category) {
        case 'Road Damage':
          department = 'Public Works Department';
          break;
        case 'Garbage Management':
          department = 'Solid Waste Management Department';
          break;
        case 'Water Leakage':
        case 'Drainage Issues':
          department = 'Water Supply & Sewerage Board';
          break;
        case 'Streetlight Problems':
          department = 'Electrical & Energy Department';
          break;
        case 'Public Safety':
          department = 'City Traffic & Public Safety';
          break;
        default:
          department = 'Municipal General Administration';
      }
    }

    const newComplaint: Complaint = {
      id: newId,
      user_id: currentUser.id,
      user_name: currentUser.full_name,
      user_phone: currentUser.phone,
      title: data.title,
      description: data.description,
      category: data.category,
      image_url: data.image_url,
      latitude: data.latitude,
      longitude: data.longitude,
      address: data.address,
      severity: data.severity,
      public_safety_risk: safetyRisk,
      priority_score: score,
      priority_level: level,
      status: 'Submitted',
      assigned_department: department,
      assigned_officer: null,
      deadline: deadlineISO,
      resolved_at: null,
      resolution_proof_url: null,
      resolution_notes: null,
      created_at: nowISO,
      support_count: 1,
      supporters: [currentUser.id],
      is_escalated: false,
      escalation_reason: null,
    };

    const initialUpdate: ComplaintUpdate = {
      id: `upd-${Date.now()}`,
      complaint_id: newId,
      updated_by_id: currentUser.id,
      updated_by_name: currentUser.full_name,
      role: currentUser.role,
      status: 'Submitted',
      remarks: 'Complaint registered by citizen with GPS location and photo proof.',
      created_at: nowISO,
    };

    const citizenNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      user_id: currentUser.id,
      complaint_id: newId,
      title: 'Complaint Registered Successfully',
      message: `Your report "${data.title}" has been assigned tracking ID ${newId}. SLA Target: ${level} priority.`,
      type: 'status_change',
      is_read: false,
      created_at: nowISO,
    };

    setComplaints((prev) => [newComplaint, ...prev]);
    setUpdates((prev) => [initialUpdate, ...prev]);
    setNotifications((prev) => [citizenNotif, ...prev]);

    showToast(`Complaint ${newId} submitted with ${level} priority!`, 'success');
    return newComplaint;
  };

  const supportExistingComplaint = async (complaintId: string): Promise<boolean> => {
    const target = complaints.find((c) => c.id === complaintId);
    if (!target) return false;

    if (target.supporters.includes(currentUser.id)) {
      showToast('You have already supported this civic complaint!', 'warning');
      return false;
    }

    const updatedSupporters = [...target.supporters, currentUser.id];
    const newSupportCount = target.support_count + 1;

    // Recalculate priority score with updated community impact
    const { score, level } = calculatePriorityScore({
      category: target.category,
      severity: target.severity,
      publicSafetyRisk: target.public_safety_risk,
      supportCount: newSupportCount,
      createdAtISO: target.created_at,
      isResolved: target.status === 'Resolved',
    });

    const updatedComplaint: Complaint = {
      ...target,
      support_count: newSupportCount,
      supporters: updatedSupporters,
      priority_score: score,
      priority_level: level,
    };

    const updateRecord: ComplaintUpdate = {
      id: `upd-${Date.now()}`,
      complaint_id: complaintId,
      updated_by_id: currentUser.id,
      updated_by_name: currentUser.full_name,
      role: currentUser.role,
      status: target.status,
      remarks: `Citizen support added by ${currentUser.full_name}. Priority urgency updated to ${score}/100.`,
      created_at: new Date().toISOString(),
    };

    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      user_id: target.user_id,
      complaint_id: complaintId,
      title: 'Civic Support Gained!',
      message: `${currentUser.full_name} supported your complaint ${complaintId}. Total supporters: ${newSupportCount}.`,
      type: 'duplicate_support',
      is_read: false,
      created_at: new Date().toISOString(),
    };

    setComplaints((prev) => prev.map((c) => (c.id === complaintId ? updatedComplaint : c)));
    setUpdates((prev) => [updateRecord, ...prev]);
    setNotifications((prev) => [notif, ...prev]);

    showToast(`Supported ${complaintId}! Priority increased to ${score}/100.`, 'success');
    return true;
  };

  const updateComplaintStatus = async (
    complaintId: string,
    newStatus: ComplaintStatus,
    remarks: string,
    options?: {
      assigned_department?: string;
      assigned_officer?: string | null;
      assigned_officer_name?: string | null;
      resolution_proof_url?: string | null;
      resolution_notes?: string | null;
    }
  ): Promise<boolean> => {
    const target = complaints.find((c) => c.id === complaintId);
    if (!target) return false;

    const nowISO = new Date().toISOString();
    const isResolved = newStatus === 'Resolved';

    const updatedComplaint: Complaint = {
      ...target,
      status: newStatus,
      assigned_department: options?.assigned_department || target.assigned_department,
      assigned_officer: options?.assigned_officer !== undefined ? options.assigned_officer : target.assigned_officer,
      assigned_officer_name: options?.assigned_officer_name !== undefined ? options.assigned_officer_name : target.assigned_officer_name,
      resolution_proof_url: options?.resolution_proof_url || target.resolution_proof_url,
      resolution_notes: options?.resolution_notes || target.resolution_notes,
      resolved_at: isResolved ? nowISO : target.resolved_at,
    };

    const updateRecord: ComplaintUpdate = {
      id: `upd-${Date.now()}`,
      complaint_id: complaintId,
      updated_by_id: currentUser.id,
      updated_by_name: currentUser.full_name,
      role: currentUser.role,
      status: newStatus,
      remarks: remarks || `Status transitioned to ${newStatus}`,
      proof_url: options?.resolution_proof_url || null,
      created_at: nowISO,
    };

    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      user_id: target.user_id,
      complaint_id: complaintId,
      title: `Complaint Status: ${newStatus}`,
      message: `${remarks || `Your complaint ${complaintId} has been marked as ${newStatus}`}`,
      type: isResolved ? 'resolved' : 'status_change',
      is_read: false,
      created_at: nowISO,
    };

    setComplaints((prev) => prev.map((c) => (c.id === complaintId ? updatedComplaint : c)));
    setUpdates((prev) => [updateRecord, ...prev]);
    setNotifications((prev) => [notif, ...prev]);

    showToast(`Complaint ${complaintId} updated to "${newStatus}"`, 'success');
    return true;
  };

  const escalateComplaint = async (complaintId: string, reason: string): Promise<boolean> => {
    const target = complaints.find((c) => c.id === complaintId);
    if (!target) return false;

    const nowISO = new Date().toISOString();
    const updatedComplaint: Complaint = {
      ...target,
      is_escalated: true,
      escalation_reason: reason,
      priority_score: Math.min(100, target.priority_score + 10),
      priority_level: 'Critical',
    };

    const updateRecord: ComplaintUpdate = {
      id: `upd-${Date.now()}`,
      complaint_id: complaintId,
      updated_by_id: currentUser.id,
      updated_by_name: currentUser.full_name,
      role: currentUser.role,
      status: target.status,
      remarks: `ESCALATION: ${reason}`,
      created_at: nowISO,
    };

    const adminNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      user_id: 'usr-admin-1',
      complaint_id: complaintId,
      title: 'ESCALATION ALERT',
      message: `Complaint ${complaintId} has been escalated: ${reason}`,
      type: 'escalation',
      is_read: false,
      created_at: nowISO,
    };

    setComplaints((prev) => prev.map((c) => (c.id === complaintId ? updatedComplaint : c)));
    setUpdates((prev) => [updateRecord, ...prev]);
    setNotifications((prev) => [adminNotif, ...prev]);

    showToast(`Complaint ${complaintId} escalated to higher authority`, 'warning');
    return true;
  };

  const checkDuplicates = (params: {
    title: string;
    description: string;
    category: Category;
    latitude: number;
    longitude: number;
  }): DuplicateMatch[] => {
    return findPotentialDuplicates(params, complaints);
  };

  const analyzeWithAI = async (params: {
    imageBase64?: string;
    mimeType?: string;
    descriptionText?: string;
  }): Promise<AIPredictionResult> => {
    try {
      const response = await fetch('/api/ai/analyze-complaint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      return data as AIPredictionResult;
    } catch (err: any) {
      console.warn('AI API endpoint failed, generating local fallback:', err?.message);
      // Fallback
      return {
        source: 'local-heuristic',
        category: 'Road Damage',
        problemTitle: 'Pothole & Surface Damage Detected',
        problemDescription: 'Detected roadway degradation with hazardous gravel displacement.',
        suggestedDepartment: 'Public Works Department',
        estimatedSeverity: 'High',
        publicSafetyRisk: true,
        urgencyPoints: 32,
        recommendedAction: 'Rapid cold-mix or hot-mix asphalt patching deployment.',
        confidenceScore: 0.88,
      };
    }
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    showToast('All notifications marked as read', 'info');
  };

  const resetToDemoData = () => {
    setComplaints(INITIAL_COMPLAINTS);
    setUpdates(INITIAL_UPDATES);
    setNotifications(INITIAL_NOTIFICATIONS);
    setCurrentUser(INITIAL_PROFILES[0]);
    localStorage.removeItem(STORAGE_KEY_COMPLAINTS);
    localStorage.removeItem(STORAGE_KEY_UPDATES);
    localStorage.removeItem(STORAGE_KEY_NOTIFS);
    localStorage.removeItem(STORAGE_KEY_USER);
    showToast('Reset system to default demo state with 8 seed complaints', 'info');
  };

  return (
    <CivicContext.Provider
      value={{
        currentUser,
        allUsers,
        setCurrentUser,
        switchRole,
        complaints,
        updates,
        notifications,
        hotspots,
        createComplaint,
        supportExistingComplaint,
        updateComplaintStatus,
        escalateComplaint,
        checkDuplicates,
        analyzeWithAI,
        markNotificationRead,
        markAllNotificationsRead,
        resetToDemoData,
        toast,
        showToast,
      }}
    >
      {children}
    </CivicContext.Provider>
  );
};

export const useCivic = () => {
  const context = useContext(CivicContext);
  if (!context) {
    throw new Error('useCivic must be used within a CivicProvider');
  }
  return context;
};
