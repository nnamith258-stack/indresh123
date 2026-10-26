import React, { useState } from 'react';
import {
  X,
  MapPin,
  Clock,
  Calendar,
  AlertTriangle,
  Users,
  ShieldCheck,
  CheckCircle2,
  HardHat,
  Share2,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  FileCheck2,
} from 'lucide-react';
import { Complaint, ComplaintStatus } from '../types';
import { useCivic } from '../context/CivicContext';
import { getPriorityBadge, getStatusBadge, getDeadlineInfo } from '../utils/priority';
import { MapView } from './MapView';

interface ComplaintDetailsModalProps {
  complaint: Complaint | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenOfficerUpdate?: (complaint: Complaint) => void;
}

export const ComplaintDetailsModal: React.FC<ComplaintDetailsModalProps> = ({
  complaint,
  isOpen,
  onClose,
  onOpenOfficerUpdate,
}) => {
  const { currentUser, updates, supportExistingComplaint, escalateComplaint, showToast } = useCivic();
  const [escalateReason, setEscalateReason] = useState('');
  const [showEscalateInput, setShowEscalateInput] = useState(false);

  if (!isOpen || !complaint) return null;

  const complaintUpdates = updates.filter((u) => u.complaint_id === complaint.id);
  const priorityInfo = getPriorityBadge(complaint.priority_level);
  const deadlineInfo = getDeadlineInfo(complaint.deadline, complaint.status);
  const hasUserSupported = complaint.supporters.includes(currentUser.id);

  const handleSupport = async () => {
    await supportExistingComplaint(complaint.id);
  };

  const handleTriggerEscalation = async () => {
    if (!escalateReason.trim()) {
      showToast('Please specify reason for escalation', 'warning');
      return;
    }
    await escalateComplaint(complaint.id, escalateReason);
    setShowEscalateInput(false);
    setEscalateReason('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-sm text-slate-900">{complaint.id}</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${priorityInfo.bg}`}>
              {complaint.priority_level} Priority ({complaint.priority_score}/100)
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(complaint.status)}`}>
              {complaint.status}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Title & Escalation Banner */}
          <div>
            {complaint.is_escalated && (
              <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>
                  <strong>ESCALATED ISSUE:</strong> {complaint.escalation_reason || 'Resolution deadline breached.'}
                </span>
              </div>
            )}
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
              {complaint.title}
            </h2>
            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 mt-2">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                {complaint.address}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Reported {new Date(complaint.created_at).toLocaleDateString()} by {complaint.user_name}
              </span>
            </div>
          </div>

          {/* Photographic Evidence: Before & After */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Citizen Photo Evidence</span>
                <span className="text-[10px] text-slate-400">Reported</span>
              </div>
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video">
                <img
                  src={complaint.image_url}
                  alt={complaint.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div>
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Resolution Proof Photo</span>
                {complaint.resolution_proof_url ? (
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Verified Work
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400">Pending Completion</span>
                )}
              </div>
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 aspect-video flex items-center justify-center">
                {complaint.resolution_proof_url ? (
                  <img
                    src={complaint.resolution_proof_url}
                    alt="Resolution Proof"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-4">
                    <HardHat className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                    <p className="text-xs text-slate-400">Proof photo will be uploaded upon work completion</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Problem Description
            </h4>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {complaint.description}
            </p>
            {complaint.resolution_notes && (
              <div className="mt-3 pt-3 border-t border-slate-200 text-xs">
                <span className="font-semibold text-emerald-800">Department Resolution Notes:</span>
                <p className="text-slate-600 mt-0.5">{complaint.resolution_notes}</p>
              </div>
            )}
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl border border-slate-200 bg-white shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Assigned Dept
              </span>
              <span className="text-xs font-bold text-slate-800 line-clamp-2">
                {complaint.assigned_department}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                {complaint.assigned_officer_name || 'Officer unassigned'}
              </span>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 bg-white shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Feature 3: SLA Deadline
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded border inline-block ${deadlineInfo.badgeColor}`}>
                {deadlineInfo.label}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Due: {new Date(complaint.deadline).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit' })}
              </span>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 bg-white shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Feature 2: Priority Score
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-slate-900">{complaint.priority_score}/100</span>
                <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Dynamic risk algorithm
              </span>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 bg-white shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Citizen Backing
              </span>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">
                  {complaint.support_count} supporters
                </span>
                <Users className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <button
                type="button"
                onClick={handleSupport}
                disabled={hasUserSupported}
                className={`mt-1 text-[10px] font-bold px-2 py-0.5 rounded transition-colors ${
                  hasUserSupported
                    ? 'bg-emerald-50 text-emerald-700 cursor-default'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {hasUserSupported ? '✓ Supported' : '+1 Support'}
              </button>
            </div>
          </div>

          {/* Location Map Preview */}
          <div>
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Geographic Location
            </div>
            <MapView
              complaints={[complaint]}
              selectedComplaintId={complaint.id}
              initialCenter={[complaint.latitude, complaint.longitude]}
              height="180px"
              showHotspots={false}
            />
          </div>

          {/* Audit Timeline / Updates Trail */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Official Resolution Audit Trail ({complaintUpdates.length} log{complaintUpdates.length !== 1 ? 's' : ''})
            </h4>
            <div className="space-y-3 pl-3 border-l-2 border-blue-200 ml-2">
              {complaintUpdates.length === 0 ? (
                <p className="text-xs text-slate-400">No updates logged yet.</p>
              ) : (
                complaintUpdates.map((item) => (
                  <div key={item.id} className="relative group text-xs">
                    <span className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-white"></span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">{item.status}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(item.created_at).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="text-[10px] font-medium text-blue-600">
                        by {item.updated_by_name} ({item.role})
                      </span>
                    </div>
                    <p className="text-slate-600 text-xs mt-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      {item.remarks}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Escalation Trigger (For Admin or Citizen when Overdue) */}
          {(currentUser.role === 'admin' || deadlineInfo.isOverdue) && !complaint.is_escalated && (
            <div className="p-3 rounded-xl border border-rose-200 bg-rose-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Municipal Escalation Control
                  </h5>
                  <p className="text-[11px] text-rose-700 mt-0.5">
                    Flag this issue for emergency zonal commissioner intervention.
                  </p>
                </div>
                {!showEscalateInput && (
                  <button
                    onClick={() => setShowEscalateInput(true)}
                    className="px-3 py-1 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors"
                  >
                    Escalate
                  </button>
                )}
              </div>

              {showEscalateInput && (
                <div className="mt-3 space-y-2">
                  <input
                    type="text"
                    value={escalateReason}
                    onChange={(e) => setEscalateReason(e.target.value)}
                    placeholder="Enter reason for municipal escalation..."
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-rose-300 focus:outline-hidden focus:ring-2 focus:ring-rose-500 bg-white"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setShowEscalateInput(false)}
                      className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleTriggerEscalation}
                      className="px-3 py-1 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700 transition-colors"
                    >
                      Confirm Escalation
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Coordinates: {complaint.latitude}, {complaint.longitude}
          </div>

          <div className="flex items-center gap-2">
            {/* If Officer or Admin, allow opening resolution update */}
            {(currentUser.role === 'admin' || currentUser.role === 'officer') &&
              complaint.status !== 'Resolved' && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenOfficerUpdate) onOpenOfficerUpdate(complaint);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  Update Progress / Resolve
                </button>
              )}

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
