import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Complaint, RecurringProblemArea, Category } from '../types';
import { getPriorityBadge } from '../utils/priority';

interface MapViewProps {
  complaints: Complaint[];
  hotspots?: RecurringProblemArea[];
  selectedComplaintId?: string | null;
  onSelectComplaint?: (complaint: Complaint) => void;
  interactiveLocationPicker?: boolean;
  onLocationPick?: (lat: number, lng: number) => void;
  initialCenter?: [number, number];
  initialZoom?: number;
  height?: string;
  showHotspots?: boolean;
}

// Category marker colors
const CATEGORY_COLORS: Record<Category, string> = {
  'Road Damage': '#f97316', // orange
  'Garbage Management': '#10b981', // emerald
  'Water Leakage': '#0284c7', // sky blue
  'Drainage Issues': '#6366f1', // indigo
  'Streetlight Problems': '#f59e0b', // amber
  'Public Safety': '#ef4444', // red
  'Other Civic Issues': '#64748b', // slate
};

export const MapView: React.FC<MapViewProps> = ({
  complaints,
  hotspots = [],
  selectedComplaintId,
  onSelectComplaint,
  interactiveLocationPicker = false,
  onLocationPick,
  initialCenter = [37.7758, -122.418],
  initialZoom = 14,
  height = '500px',
  showHotspots = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const hotspotsGroupRef = useRef<L.LayerGroup | null>(null);
  const pickerMarkerRef = useRef<L.Marker | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: initialZoom,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      markersGroupRef.current = L.layerGroup().addTo(map);
      hotspotsGroupRef.current = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Handle Interactive Location Picking
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (!interactiveLocationPicker || !onLocationPick) return;

      const { lat, lng } = e.latlng;
      onLocationPick(Number(lat.toFixed(6)), Number(lng.toFixed(6)));

      if (pickerMarkerRef.current) {
        pickerMarkerRef.current.setLatLng(e.latlng);
      } else {
        const pickerIcon = L.divIcon({
          className: 'custom-picker-pin',
          html: `<div class="relative flex items-center justify-center">
            <span class="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-blue-400 opacity-75"></span>
            <div class="w-8 h-8 rounded-full bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-xs">
              📍
            </div>
          </div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        });

        pickerMarkerRef.current = L.marker(e.latlng, { icon: pickerIcon }).addTo(map);
      }
    };

    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
    };
  }, [interactiveLocationPicker, onLocationPick]);

  // Update Markers when complaints or selection changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    complaints.forEach((complaint) => {
      const color = CATEGORY_COLORS[complaint.category] || '#3b82f6';
      const isSelected = selectedComplaintId === complaint.id;
      const isCritical = complaint.priority_level === 'Critical';

      // SVG marker icon
      const iconHtml = `
        <div class="relative group cursor-pointer transition-transform hover:scale-110 ${
          isSelected ? 'scale-125 z-50' : ''
        }">
          ${
            isCritical
              ? `<span class="animate-ping absolute -top-1 -left-1 inline-flex h-8 w-8 rounded-full bg-red-400 opacity-60"></span>`
              : ''
          }
          <div style="background-color: ${color};" class="w-8 h-8 rounded-full border-2 border-white shadow-md flex items-center justify-center text-white text-xs font-semibold">
            ${complaint.category.charAt(0)}
          </div>
          <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45 transform origin-center"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-complaint-marker',
        html: iconHtml,
        iconSize: [32, 36],
        iconAnchor: [16, 36],
        popupAnchor: [0, -36],
      });

      const marker = L.marker([complaint.latitude, complaint.longitude], {
        icon: customIcon,
      });

      const priorityInfo = getPriorityBadge(complaint.priority_level);

      const popupHtml = `
        <div class="p-2 min-w-[200px] max-w-[260px] font-sans">
          <div class="flex items-center justify-between gap-2 mb-1.5">
            <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">${complaint.id}</span>
            <span class="px-2 py-0.5 rounded text-[10px] font-medium border ${priorityInfo.bg}">
              ${complaint.priority_level}
            </span>
          </div>
          <h4 class="font-semibold text-xs text-slate-900 leading-snug line-clamp-2 mb-1">${complaint.title}</h4>
          <p class="text-[11px] text-slate-600 line-clamp-2 mb-2">${complaint.address}</p>
          <div class="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-500">
            <span>Status: <strong class="text-slate-800">${complaint.status}</strong></span>
            <span>👥 ${complaint.support_count} supports</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        if (onSelectComplaint) {
          onSelectComplaint(complaint);
        }
      });

      markersGroup.addLayer(marker);
    });

    // Fly to selected complaint if provided
    if (selectedComplaintId) {
      const selected = complaints.find((c) => c.id === selectedComplaintId);
      if (selected) {
        map.flyTo([selected.latitude, selected.longitude], 16, { duration: 1 });
      }
    }
  }, [complaints, selectedComplaintId, onSelectComplaint]);

  // Update Repeat-Problem Hotspots layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    const hotspotsGroup = hotspotsGroupRef.current;
    if (!map || !hotspotsGroup) return;

    hotspotsGroup.clearLayers();

    if (showHotspots && hotspots.length > 0) {
      hotspots.forEach((spot) => {
        const radius = spot.risk_level === 'Severe' ? 180 : spot.risk_level === 'High' ? 140 : 100;
        const color =
          spot.risk_level === 'Severe'
            ? '#ef4444' // red
            : spot.risk_level === 'High'
            ? '#f97316' // orange
            : '#eab308'; // yellow

        const circle = L.circle([spot.latitude, spot.longitude], {
          radius: radius,
          color: color,
          weight: 2,
          opacity: 0.8,
          fillColor: color,
          fillOpacity: 0.22,
          dashArray: '4, 4',
        });

        const hotspotPopup = `
          <div class="p-2 max-w-[260px] font-sans">
            <div class="flex items-center gap-1.5 text-xs font-bold text-red-600 mb-1">
              <span>⚠️ RECURRING CIVIC HOTSPOT</span>
            </div>
            <p class="text-xs font-semibold text-slate-800 mb-1">${spot.category} (${spot.complaint_count} incidents)</p>
            <p class="text-[11px] text-slate-600 mb-2">${spot.recurrence_period}</p>
            <div class="bg-red-50 p-1.5 rounded text-[10px] text-red-800 border border-red-200">
              <strong>Risk: ${spot.risk_level}</strong>
              <p class="mt-0.5">${spot.recommendation}</p>
            </div>
          </div>
        `;

        circle.bindPopup(hotspotPopup);
        hotspotsGroup.addLayer(circle);
      });
    }
  }, [hotspots, showHotspots]);

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
      <div ref={mapContainerRef} style={{ height, width: '100%' }} />

      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm p-2.5 rounded-lg border border-slate-200/80 shadow-md text-xs pointer-events-auto max-w-[260px] hidden sm:block">
        <div className="font-semibold text-slate-700 mb-1.5 text-[11px] flex items-center justify-between">
          <span>Complaint Categories</span>
          {showHotspots && (
            <span className="text-[10px] text-red-600 font-medium">Hotspots Active</span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span>
            <span>Road Damage</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <span>Garbage Mgmt</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-600 inline-block"></span>
            <span>Water Leak</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block"></span>
            <span>Drainage</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
            <span>Streetlight</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
            <span>Public Safety</span>
          </div>
        </div>
      </div>

      {interactiveLocationPicker && (
        <div className="absolute top-3 right-3 z-[1000] bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg shadow-md font-medium flex items-center gap-1.5">
          <span>Click anywhere on the map to set complaint location</span>
        </div>
      )}
    </div>
  );
};
