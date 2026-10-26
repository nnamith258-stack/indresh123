import React, { useState } from 'react';
import {
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Users,
  Search,
  Filter,
  ArrowUpRight,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useCivic } from '../context/CivicContext';
import { Complaint, Category } from '../types';
import { getPriorityBadge, getStatusBadge, getDeadlineInfo } from '../utils/priority';

interface CitizenDashboardProps {
  onOpenReportModal: () => void;
  onSelectComplaint: (complaint: Complaint) => void;
}

export const CitizenDashboard: React.FC<CitizenDashboardProps> = ({
  onOpenReportModal,
  onSelectComplaint,
}) => {
  const { currentUser, complaints, supportExistingComplaint } = useCivic();
  const [filterTab, setFilterTab] = useState<'my' | 'nearby' | 'resolved' | 'all'>('my');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Filter complaints
  const myComplaints = complaints.filter((c) => c.user_id === currentUser.id);
  const resolvedComplaints = complaints.filter((c) => c.status === 'Resolved');
  const overdueComplaints = complaints.filter(
    (c) => c.status !== 'Resolved' && new Date(c.deadline).getTime() < Date.now()
  );
  const inProgressComplaints = complaints.filter(
    (c) => c.status === 'In Progress' || c.status === 'Assigned'
  );

  let displayedComplaints = complaints;
  if (filterTab === 'my') {
    displayedComplaints = myComplaints;
  } else if (filterTab === 'resolved') {
    displayedComplaints = resolvedComplaints;
  } else if (filterTab === 'nearby') {
    // Other complaints nearby
    displayedComplaints = complaints.filter((c) => c.user_id !== currentUser.id);
  }

  if (categoryFilter !== 'all') {
    displayedComplaints = displayedComplaints.filter((c) => c.category === categoryFilter);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    displayedComplaints = displayedComplaints.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome & Call to Action Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-6 sm:p-8 text-white shadow-lg shadow-blue-500/10">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold tracking-wide border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-blue-200" />
            <span>AI-Powered Citizen Governance Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
            Help Build a Safer, Cleaner City
          </h1>
          <p className="text-sm text-blue-100 max-w-xl leading-relaxed">
            Report road hazards, garbage pileups, drainage leaks, and broken streetlights. Our AI
            instantly classifies your issue and checks for duplicate reports to accelerate resolution.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={onOpenReportModal}
              className="px-5 py-2.5 rounded-xl bg-white text-blue-700 font-bold text-xs sm:text-sm shadow-md hover:bg-blue-50 transition-all flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" /> Report a Problem
            </button>
            <div className="flex items-center gap-2 text-xs text-blue-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Average Resolution SLA: 48 Hours</span>
            </div>
          </div>
        </div>

        {/* Decorative background circle */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-80 h-80 bg-white/5 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>My Reported Issues</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{myComplaints.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Submitted by you</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Under Progress</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600">{inProgressComplaints.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Field teams active</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>City Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600">{resolvedComplaints.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Verified work</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Overdue SLA</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-600">{overdueComplaints.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Escalated to admin</div>
        </div>
      </div>

      {/* Complaints Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-2xs space-y-4">
        {/* Navigation Tabs & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setFilterTab('my')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filterTab === 'my'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              My Complaints ({myComplaints.length})
            </button>
            <button
              onClick={() => setFilterTab('nearby')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filterTab === 'nearby'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Nearby Civic Issues
            </button>
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filterTab === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All City Reports ({complaints.length})
            </button>
            <button
              onClick={() => setFilterTab('resolved')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filterTab === 'resolved'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Resolved ({resolvedComplaints.length})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports or locations..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
            />
          </div>
        </div>

        {/* Complaints List Grid */}
        {displayedComplaints.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Filter className="w-6 h-6" />
            </div>
            <div className="font-semibold text-sm text-slate-700">No complaints found</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {filterTab === 'my'
                ? "You haven't submitted any complaints yet. Report an issue in your neighborhood to notify city authorities!"
                : 'No complaints match the current filter criteria.'}
            </p>
            {filterTab === 'my' && (
              <button
                onClick={onOpenReportModal}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors"
              >
                <PlusCircle className="w-4 h-4" /> Report Problem Now
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedComplaints.map((item) => {
              const priorityInfo = getPriorityBadge(item.priority_level);
              const deadlineInfo = getDeadlineInfo(item.deadline, item.status);
              const hasSupported = item.supporters.includes(currentUser.id);

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden hover:shadow-md transition-all flex flex-col group"
                >
                  {/* Photo Preview with Badges */}
                  <div className="relative aspect-video bg-slate-100 overflow-hidden cursor-pointer" onClick={() => onSelectComplaint(item)}>
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border backdrop-blur-xs bg-white/90 ${priorityInfo.bg}`}>
                        {item.priority_level}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border backdrop-blur-xs bg-white/90 ${getStatusBadge(item.status)}`}>
                        {item.status}
                      </span>
                    </div>

                    <div className="absolute bottom-2.5 right-2.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border backdrop-blur-xs shadow-xs ${deadlineInfo.badgeColor}`}>
                        {deadlineInfo.label}
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-mono font-bold text-slate-600">{item.id}</span>
                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                      <h3
                        onClick={() => onSelectComplaint(item)}
                        className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 cursor-pointer leading-snug"
                      >
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="space-y-3 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="truncate">{item.address}</span>
                      </div>

                      {/* Card Footer: Supporters & Actions */}
                      <div className="flex items-center justify-between pt-1 text-xs">
                        <div className="flex items-center gap-1 text-slate-600">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-semibold text-slate-800">{item.support_count}</span>
                          <span className="text-[11px] text-slate-500">supporters</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              supportExistingComplaint(item.id);
                            }}
                            disabled={hasSupported}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                              hasSupported
                                ? 'bg-emerald-50 text-emerald-700 cursor-default'
                                : 'bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700'
                            }`}
                          >
                            {hasSupported ? '✓ Backed' : '+1 Support'}
                          </button>

                          <button
                            type="button"
                            onClick={() => onSelectComplaint(item)}
                            className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="View full audit trail"
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
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
