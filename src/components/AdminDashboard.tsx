import React, { useState } from 'react';
import {
  Shield,
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingUp,
  Search,
  Filter,
  ArrowUpDown,
  Building2,
  MapPin,
  ExternalLink,
  Flame,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useCivic } from '../context/CivicContext';
import { Complaint, ComplaintStatus, Category, PriorityLevel } from '../types';
import { getPriorityBadge, getStatusBadge, getDeadlineInfo } from '../utils/priority';

interface AdminDashboardProps {
  onSelectComplaint: (complaint: Complaint) => void;
  onOpenOfficerUpdate?: (complaint: Complaint) => void;
  onViewHotspotsTab?: () => void;
}

const PIE_COLORS = ['#ef4444', '#f97316', '#3b82f6', '#10b981'];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onSelectComplaint,
  onOpenOfficerUpdate,
  onViewHotspotsTab,
}) => {
  const { complaints, hotspots, currentUser, escalateComplaint } = useCivic();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'urgency' | 'deadline' | 'created'>('urgency');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // KPI calculations
  const totalCount = complaints.length;
  const pendingCount = complaints.filter(
    (c) => c.status === 'Submitted' || c.status === 'Under Review' || c.status === 'Assigned'
  ).length;
  const inProgressCount = complaints.filter((c) => c.status === 'In Progress').length;
  const resolvedCount = complaints.filter((c) => c.status === 'Resolved').length;
  const criticalCount = complaints.filter((c) => c.priority_level === 'Critical').length;
  const overdueCount = complaints.filter(
    (c) => c.status !== 'Resolved' && new Date(c.deadline).getTime() < Date.now()
  ).length;

  // Department-wise workload statistics for BarChart
  const departmentWorkloadMap: Record<string, { total: number; pending: number; resolved: number }> = {};
  complaints.forEach((c) => {
    const dept = c.assigned_department || 'Unassigned';
    if (!departmentWorkloadMap[dept]) {
      departmentWorkloadMap[dept] = { total: 0, pending: 0, resolved: 0 };
    }
    departmentWorkloadMap[dept].total += 1;
    if (c.status === 'Resolved') {
      departmentWorkloadMap[dept].resolved += 1;
    } else {
      departmentWorkloadMap[dept].pending += 1;
    }
  });

  const departmentChartData = Object.entries(departmentWorkloadMap).map(([name, data]) => ({
    name: name.replace(' Department', '').replace(' Board', ''),
    Pending: data.pending,
    Resolved: data.resolved,
  }));

  // Priority distribution for PieChart
  const priorityCountMap: Record<PriorityLevel, number> = {
    Critical: 0,
    High: 0,
    Medium: 0,
    Low: 0,
  };
  complaints.forEach((c) => {
    priorityCountMap[c.priority_level] = (priorityCountMap[c.priority_level] || 0) + 1;
  });

  const priorityChartData = [
    { name: 'Critical', value: priorityCountMap['Critical'] },
    { name: 'High', value: priorityCountMap['High'] },
    { name: 'Medium', value: priorityCountMap['Medium'] },
    { name: 'Low', value: priorityCountMap['Low'] },
  ];

  // Filtering & Sorting
  let filtered = complaints.filter((c) => {
    const matchesCategory = selectedCategory === 'all' || c.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || c.status === selectedStatus;
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      c.title.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q);

    return matchesCategory && matchesStatus && matchesSearch;
  });

  filtered.sort((a, b) => {
    if (sortBy === 'urgency') {
      return sortOrder === 'desc'
        ? b.priority_score - a.priority_score
        : a.priority_score - b.priority_score;
    } else if (sortBy === 'deadline') {
      const timeA = new Date(a.deadline).getTime();
      const timeB = new Date(b.deadline).getTime();
      return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
    } else {
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    }
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginatedComplaints = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Top Municipal Executive Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-400/30">
              <Shield className="w-4 h-4" />
            </span>
            <span className="text-xs uppercase tracking-wider font-bold text-slate-300">
              Executive Municipal Control Panel
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold">
              Live Governance Engine
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Municipal Complaint Oversight & Urgency Prioritization
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Logged in as <strong>{currentUser.full_name}</strong>. Real-time complaint dispatching,
            automated SLA deadline enforcement, and recurring hotspot intelligence.
          </p>
        </div>

        {/* Hotspots Callout Button */}
        {hotspots.length > 0 && (
          <div
            onClick={onViewHotspotsTab}
            className="cursor-pointer bg-red-950/60 hover:bg-red-900/60 border border-red-700/50 rounded-xl p-3 text-xs transition-colors shrink-0 max-w-xs"
          >
            <div className="flex items-center gap-1.5 text-red-400 font-bold mb-1">
              <Flame className="w-4 h-4 text-red-500 animate-pulse" />
              <span>Feature 5: {hotspots.length} Active Hotspot Clusters</span>
            </div>
            <p className="text-[11px] text-red-200">
              Repeating civic problem locations detected by proximity clustering.
            </p>
          </div>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Total Reports</span>
          <div className="text-2xl font-bold text-slate-900">{totalCount}</div>
          <span className="text-[10px] text-slate-400 mt-1 block">Registered in city</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Pending Action</span>
          <div className="text-2xl font-bold text-blue-600">{pendingCount}</div>
          <span className="text-[10px] text-blue-500 mt-1 block">Awaiting / Assigned</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">In Progress</span>
          <div className="text-2xl font-bold text-amber-600">{inProgressCount}</div>
          <span className="text-[10px] text-amber-500 mt-1 block">Field crews active</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Critical Urgency</span>
          <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
          <span className="text-[10px] text-red-500 mt-1 block">Safety hazard risks</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">SLA Overdue</span>
          <div className="text-2xl font-bold text-rose-600">{overdueCount}</div>
          <span className="text-[10px] text-rose-500 mt-1 block">Deadline breached</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Resolved Rate</span>
          <div className="text-2xl font-bold text-emerald-600">
            {totalCount > 0 ? `${Math.round((resolvedCount / totalCount) * 100)}%` : '0%'}
          </div>
          <span className="text-[10px] text-emerald-500 mt-1 block">
            {resolvedCount} resolved issues
          </span>
        </div>
      </div>

      {/* Analytics Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Workload BarChart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Department Workload & Resolution Status
              </h3>
              <p className="text-xs text-slate-500">Active vs resolved complaints across municipal departments</p>
            </div>
            <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2.5 py-1 rounded-lg">
              Live Workload
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="Pending" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Resolved" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Distribution PieChart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Priority Distribution</h3>
            <p className="text-xs text-slate-500">Feature 2: Dynamic urgency level breakdown</p>
          </div>

          <div className="h-44 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {priorityChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
            {priorityChartData.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: PIE_COLORS[idx] }}
                ></span>
                <span className="text-slate-600">
                  {item.name}: <strong className="text-slate-900">{item.value}</strong>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Complaints Management Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Table Filters & Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Official Complaint Management Directory
              </h3>
              <p className="text-xs text-slate-500">
                Sorted by Smart Priority Urgency Score (0 - 100) and SLA Deadlines
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Sort:</span>
              <button
                onClick={() => {
                  if (sortBy === 'urgency') {
                    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                  } else {
                    setSortBy('urgency');
                    setSortOrder('desc');
                  }
                }}
                className={`px-2.5 py-1 text-xs rounded-lg font-semibold flex items-center gap-1 transition-colors ${
                  sortBy === 'urgency'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>Urgency</span>
                <ArrowUpDown className="w-3 h-3" />
              </button>
              <button
                onClick={() => {
                  if (sortBy === 'deadline') {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortBy('deadline');
                    setSortOrder('asc');
                  }
                }}
                className={`px-2.5 py-1 text-xs rounded-lg font-semibold flex items-center gap-1 transition-colors ${
                  sortBy === 'deadline'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>Deadline</span>
                <ArrowUpDown className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Search & Category Filter Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search ID, title, or address..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Categories</option>
              <option value="Road Damage">Road Damage</option>
              <option value="Garbage Management">Garbage Management</option>
              <option value="Water Leakage">Water Leakage</option>
              <option value="Drainage Issues">Drainage Issues</option>
              <option value="Streetlight Problems">Streetlight Problems</option>
              <option value="Public Safety">Public Safety</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Under Review">Under Review</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>

        {/* Complaints Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Complaint ID & Title</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Priority Score</th>
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">SLA Deadline</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedComplaints.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No complaints matching filters
                  </td>
                </tr>
              ) : (
                paginatedComplaints.map((item) => {
                  const priorityInfo = getPriorityBadge(item.priority_level);
                  const deadlineInfo = getDeadlineInfo(item.deadline, item.status);

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => onSelectComplaint(item)}
                    >
                      {/* ID & Title */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-700">{item.id}</span>
                          {item.is_escalated && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-red-100 text-red-800 font-bold uppercase">
                              Escalated
                            </span>
                          )}
                        </div>
                        <div className="font-semibold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                          {item.title}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span className="truncate">{item.address}</span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                          {item.category}
                        </span>
                      </td>

                      {/* Priority Score */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${priorityInfo.dot}`}></span>
                          <span className={`px-2 py-0.5 rounded border text-[11px] font-semibold ${priorityInfo.bg}`}>
                            {item.priority_level} ({item.priority_score})
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          👥 {item.support_count} supporters
                        </span>
                      </td>

                      {/* Department */}
                      <td className="py-3 px-3 max-w-[160px]">
                        <span className="text-slate-800 font-medium line-clamp-1">
                          {item.assigned_department}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {item.assigned_officer_name || 'Not assigned'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusBadge(item.status)}`}>
                          {item.status}
                        </span>
                      </td>

                      {/* SLA Deadline */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded border text-[11px] block font-semibold ${deadlineInfo.badgeColor}`}>
                          {deadlineInfo.label}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                          {new Date(item.deadline).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                          })}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onSelectComplaint(item)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 font-semibold text-[11px] transition-colors"
                          >
                            Inspect
                          </button>
                          {onOpenOfficerUpdate && item.status !== 'Resolved' && (
                            <button
                              type="button"
                              onClick={() => onOpenOfficerUpdate(item)}
                              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] transition-colors"
                            >
                              Dispatch
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} complaints
          </div>
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="p-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="p-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
