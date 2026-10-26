import React, { useState } from 'react';
import {
  HardHat,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Calendar,
  MapPin,
  FileCheck2,
  TrendingUp,
} from 'lucide-react';
import { useCivic } from '../context/CivicContext';
import { Complaint } from '../types';
import { getPriorityBadge, getStatusBadge, getDeadlineInfo } from '../utils/priority';

interface OfficerDashboardProps {
  onSelectComplaint: (complaint: Complaint) => void;
  onOpenOfficerUpdate: (complaint: Complaint) => void;
}

export const OfficerDashboard: React.FC<OfficerDashboardProps> = ({
  onSelectComplaint,
  onOpenOfficerUpdate,
}) => {
  const { currentUser, complaints } = useCivic();
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('all');

  // Filter complaints for this officer's department
  const officerDept = currentUser.department || 'Public Works Department';
  const deptComplaints = complaints.filter(
    (c) =>
      c.assigned_department.toLowerCase().includes(officerDept.toLowerCase().split(' ')[0]) ||
      c.assigned_department === officerDept
  );

  const pendingComplaints = deptComplaints.filter((c) => c.status !== 'Resolved');
  const resolvedComplaints = deptComplaints.filter((c) => c.status === 'Resolved');

  let displayed = deptComplaints;
  if (filter === 'pending') displayed = pendingComplaints;
  if (filter === 'resolved') displayed = resolvedComplaints;

  return (
    <div className="space-y-6">
      {/* Officer Header Card */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-2xl p-6 shadow-lg shadow-amber-500/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-white/20 text-white">
                <HardHat className="w-5 h-5" />
              </span>
              <span className="text-xs uppercase font-bold tracking-wider text-amber-100">
                Department Field Operations
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{officerDept}</h1>
            <p className="text-xs text-amber-100">
              Officer in Charge: <strong>{currentUser.full_name}</strong> • Dispatch queue and SLA compliance tracker.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/20 text-xs">
            <div>
              <span className="text-amber-200 block text-[10px] uppercase font-bold">Queue Backlog</span>
              <span className="text-xl font-bold">{pendingComplaints.length}</span>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div>
              <span className="text-amber-200 block text-[10px] uppercase font-bold">Resolved Work</span>
              <span className="text-xl font-bold">{resolvedComplaints.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                filter === 'all'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Assigned ({deptComplaints.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                filter === 'pending'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Active Tasks ({pendingComplaints.length})
            </button>
            <button
              onClick={() => setFilter('resolved')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                filter === 'resolved'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Completed ({resolvedComplaints.length})
            </button>
          </div>
          <span className="text-xs text-slate-400">
            Field reports require photo proof to mark resolved
          </span>
        </div>

        {/* Complaints Grid */}
        {displayed.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No complaints currently assigned to {officerDept} under this filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayed.map((item) => {
              const priorityInfo = getPriorityBadge(item.priority_level);
              const deadlineInfo = getDeadlineInfo(item.deadline, item.status);

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header Image */}
                    <div className="relative aspect-video bg-slate-100 overflow-hidden cursor-pointer" onClick={() => onSelectComplaint(item)}>
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border bg-white/90 ${priorityInfo.bg}`}>
                          {item.priority_level}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border bg-white/90 ${getStatusBadge(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="absolute bottom-2.5 right-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border backdrop-blur-xs ${deadlineInfo.badgeColor}`}>
                          {deadlineInfo.label}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-mono font-bold text-slate-700">{item.id}</span>
                        <span>Due: {new Date(item.deadline).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                      </div>
                      <h4
                        onClick={() => onSelectComplaint(item)}
                        className="font-bold text-sm text-slate-900 line-clamp-2 hover:text-amber-600 transition-colors cursor-pointer"
                      >
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {item.description}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-slate-500 pt-1">
                        <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="truncate">{item.address}</span>
                      </div>
                    </div>
                  </div>

                  {/* Officer Actions */}
                  <div className="p-4 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectComplaint(item)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
                    >
                      View Details
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenOfficerUpdate(item)}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      <FileCheck2 className="w-3.5 h-3.5" />
                      {item.status === 'Resolved' ? 'View Proof' : 'Update & Resolve'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
