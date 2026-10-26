import React, { useState } from 'react';
import {
  MapPin,
  Layers,
  Filter,
  PlusCircle,
  Users,
  AlertTriangle,
  Flame,
  ArrowRight,
  Compass,
} from 'lucide-react';
import { useCivic } from '../context/CivicContext';
import { Complaint, Category } from '../types';
import { MapView } from './MapView';
import { getPriorityBadge, getStatusBadge, getDeadlineInfo } from '../utils/priority';
import { calculateDistanceMeters } from '../utils/geo';

interface FullMapViewProps {
  onOpenReportModal: () => void;
  onSelectComplaint: (complaint: Complaint) => void;
}

const CATEGORIES: Category[] = [
  'Road Damage',
  'Garbage Management',
  'Water Leakage',
  'Drainage Issues',
  'Streetlight Problems',
  'Public Safety',
];

export const FullMapView: React.FC<FullMapViewProps> = ({
  onOpenReportModal,
  onSelectComplaint,
}) => {
  const { complaints, hotspots, currentUser, supportExistingComplaint } = useCivic();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showHotspots, setShowHotspots] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(
    complaints[0] || null
  );
  const [radiusFilter, setRadiusFilter] = useState<number>(0); // 0 = all, 1000, 3000, 5000

  // Filter complaints
  const filteredComplaints = complaints.filter((c) => {
    if (selectedCategory !== 'all' && c.category !== selectedCategory) return false;

    if (radiusFilter > 0) {
      // Distance from city center (37.7758, -122.418)
      const dist = calculateDistanceMeters(37.7758, -122.418, c.latitude, c.longitude);
      if (dist > radiusFilter) return false;
    }

    return true;
  });

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" /> Live Geospatial Civic Map
            </h2>
            <p className="text-xs text-slate-500">
              Interactive OpenStreetMap view with category-colored markers, priority pings, and repeat hotspot zones
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHotspots(!showHotspots)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                showHotspots
                  ? 'bg-red-50 text-red-700 border-red-300 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-red-600" />
              <span>Repeat Hotspots {showHotspots ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={onOpenReportModal}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Report at Pin</span>
            </button>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-semibold mr-1">Category:</span>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white font-semibold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Categories ({complaints.length})
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}

          {/* Distance Filter */}
          <div className="ml-auto flex items-center gap-1">
            <span className="text-slate-400 font-semibold text-[11px]">Radius:</span>
            <select
              value={radiusFilter}
              onChange={(e) => setRadiusFilter(Number(e.target.value))}
              className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-hidden"
            >
              <option value={0}>All Radius</option>
              <option value={1000}>Within 1 km</option>
              <option value={3000}>Within 3 km</option>
              <option value={5000}>Within 5 km</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Map Container */}
      <div className="relative">
        <MapView
          complaints={filteredComplaints}
          hotspots={hotspots}
          showHotspots={showHotspots}
          selectedComplaintId={selectedComplaint?.id}
          onSelectComplaint={(c) => setSelectedComplaint(c)}
          height="540px"
        />

        {/* Floating Selected Complaint Card Preview at Bottom */}
        {selectedComplaint && (
          <div className="mt-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-3">
              <img
                src={selectedComplaint.image_url}
                alt={selectedComplaint.title}
                className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-200"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-slate-800">
                    {selectedComplaint.id}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getPriorityBadge(selectedComplaint.priority_level).bg}`}>
                    {selectedComplaint.priority_level}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(selectedComplaint.status)}`}>
                    {selectedComplaint.status}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getDeadlineInfo(selectedComplaint.deadline, selectedComplaint.status).badgeColor}`}>
                    {getDeadlineInfo(selectedComplaint.deadline, selectedComplaint.status).label}
                  </span>
                </div>
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1">
                  {selectedComplaint.title}
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-1">
                  {selectedComplaint.address} • {selectedComplaint.support_count} citizens supported
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => supportExistingComplaint(selectedComplaint.id)}
                disabled={selectedComplaint.supporters.includes(currentUser.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  selectedComplaint.supporters.includes(currentUser.id)
                    ? 'bg-emerald-50 text-emerald-700 cursor-default'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                }`}
              >
                {selectedComplaint.supporters.includes(currentUser.id)
                  ? '✓ Backed'
                  : '+1 Support This'}
              </button>

              <button
                type="button"
                onClick={() => onSelectComplaint(selectedComplaint)}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <span>Full Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
