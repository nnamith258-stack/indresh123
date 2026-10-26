import React, { useState } from 'react';
import {
  Flame,
  AlertTriangle,
  MapPin,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  Building,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { useCivic } from '../context/CivicContext';
import { RecurringProblemArea, Complaint } from '../types';
import { MapView } from './MapView';

interface HotspotsViewProps {
  onSelectComplaint: (complaint: Complaint) => void;
}

export const HotspotsView: React.FC<HotspotsViewProps> = ({ onSelectComplaint }) => {
  const { hotspots, complaints } = useCivic();
  const [selectedHotspot, setSelectedHotspot] = useState<RecurringProblemArea | null>(
    hotspots[0] || null
  );

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-red-700 via-rose-700 to-orange-700 text-white rounded-2xl p-6 sm:p-8 shadow-xl shadow-red-500/10">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold tracking-wide border border-white/20">
            <Flame className="w-3.5 h-3.5 text-orange-200" />
            <span>Feature 5: Repeat-Problem Prediction Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Chronic Civic Infrastructure Hotspots
          </h1>
          <p className="text-xs sm:text-sm text-red-100 leading-relaxed">
            Statistical clustering identifies civic failure hotspots where identical infrastructure
            problems recur repeatedly within short intervals. Enables preventive capital tenders
            instead of reactive temporary patches.
          </p>
        </div>
      </div>

      {/* Map & Hotspots Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Map with Hotspots Layer (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-red-600" /> Geospatial Hotspot Clusters
                </h3>
                <p className="text-xs text-slate-500">
                  Pulsating circles highlight chronic failure corridors
                </p>
              </div>
              <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg">
                {hotspots.length} Detected Zones
              </span>
            </div>

            <MapView
              complaints={complaints}
              hotspots={hotspots}
              initialCenter={
                selectedHotspot
                  ? [selectedHotspot.latitude, selectedHotspot.longitude]
                  : [37.7758, -122.418]
              }
              initialZoom={15}
              height="460px"
              showHotspots={true}
              onSelectComplaint={onSelectComplaint}
            />

            <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
              <Info className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                Circles represent recurring problem zones. Red indicates <strong>Severe</strong> recurrence (4+ issues in 30 days), Orange indicates <strong>High</strong> (3 issues).
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Hotspot Cards & Deep Root-Cause Analysis (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Identified Hotspots</h3>
              <span className="text-xs text-slate-400">Click to inspect</span>
            </div>

            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {hotspots.map((spot) => {
                const isSelected = selectedHotspot?.id === spot.id;
                const riskBadge =
                  spot.risk_level === 'Severe'
                    ? 'bg-red-100 text-red-800 border-red-300'
                    : spot.risk_level === 'High'
                    ? 'bg-orange-100 text-orange-800 border-orange-300'
                    : 'bg-amber-100 text-amber-800 border-amber-300';

                return (
                  <div
                    key={spot.id}
                    onClick={() => setSelectedHotspot(spot)}
                    className={`p-4 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-red-500 bg-red-50/40 shadow-sm ring-1 ring-red-400/30'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-slate-900 text-sm">{spot.category}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${riskBadge}`}>
                        {spot.risk_level} Risk
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-600 mb-2 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" />
                      <span>{spot.address}</span>
                    </div>

                    <div className="bg-white p-2 rounded-lg border border-slate-100 space-y-1 mb-2 text-[11px]">
                      <div className="text-slate-500">
                        Frequency: <strong className="text-slate-800">{spot.recurrence_period}</strong>
                      </div>
                      <div className="text-slate-500">
                        Linked Reports: <span className="font-mono text-slate-700">{spot.complaint_ids.join(', ')}</span>
                      </div>
                    </div>

                    {/* Root Cause & Municipal Recommendation */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 text-[11px]">
                      <div>
                        <span className="font-bold text-slate-700 block mb-0.5">
                          Root-Cause Analysis:
                        </span>
                        <p className="text-slate-600 leading-relaxed italic">
                          "{spot.root_cause_analysis}"
                        </p>
                      </div>
                      <div className="p-2 rounded-lg bg-red-50/80 border border-red-200 text-red-900">
                        <strong className="block mb-0.5 text-red-950 font-bold">
                          Municipal Recommendation:
                        </strong>
                        <p className="text-red-800">{spot.recommendation}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
