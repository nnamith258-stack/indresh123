/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CivicProvider, useCivic } from './context/CivicContext';
import { Header } from './components/Header';
import { CitizenDashboard } from './components/CitizenDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { OfficerDashboard } from './components/OfficerDashboard';
import { FullMapView } from './components/FullMapView';
import { HotspotsView } from './components/HotspotsView';
import { ComplaintFormModal } from './components/ComplaintFormModal';
import { ComplaintDetailsModal } from './components/ComplaintDetailsModal';
import { OfficerUpdateModal } from './components/OfficerUpdateModal';
import { SupabaseSchemaModal } from './components/SupabaseSchemaModal';
import { Complaint } from './types';
import { CheckCircle2, AlertTriangle, Info, AlertCircle, X } from 'lucide-react';

const AppContent: React.FC = () => {
  const { currentUser, toast } = useCivic();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'map' | 'hotspots' | 'complaints'>('dashboard');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [officerUpdateComplaint, setOfficerUpdateComplaint] = useState<Complaint | null>(null);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div
            className={`p-3.5 rounded-2xl shadow-xl border flex items-center gap-3 text-xs font-semibold ${
              toast.type === 'success'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/20'
                : toast.type === 'error'
                ? 'bg-rose-600 text-white border-rose-500 shadow-rose-500/20'
                : toast.type === 'warning'
                ? 'bg-amber-500 text-white border-amber-400 shadow-amber-500/20'
                : 'bg-slate-900 text-white border-slate-800 shadow-slate-900/20'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-200" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0 text-rose-200" />}
            {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 shrink-0 text-amber-200" />}
            {toast.type === 'info' && <Info className="w-4 h-4 shrink-0 text-blue-200" />}
            <span className="flex-1">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Municipal Top Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenSchemaModal={() => setIsSchemaModalOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <>
            {currentUser.role === 'admin' ? (
              <AdminDashboard
                onSelectComplaint={(c) => setSelectedComplaint(c)}
                onOpenOfficerUpdate={(c) => setOfficerUpdateComplaint(c)}
                onViewHotspotsTab={() => setActiveTab('hotspots')}
              />
            ) : currentUser.role === 'officer' ? (
              <OfficerDashboard
                onSelectComplaint={(c) => setSelectedComplaint(c)}
                onOpenOfficerUpdate={(c) => setOfficerUpdateComplaint(c)}
              />
            ) : (
              <CitizenDashboard
                onOpenReportModal={() => setIsReportModalOpen(true)}
                onSelectComplaint={(c) => setSelectedComplaint(c)}
              />
            )}
          </>
        )}

        {activeTab === 'map' && (
          <FullMapView
            onOpenReportModal={() => setIsReportModalOpen(true)}
            onSelectComplaint={(c) => setSelectedComplaint(c)}
          />
        )}

        {activeTab === 'hotspots' && (
          <HotspotsView onSelectComplaint={(c) => setSelectedComplaint(c)} />
        )}

        {activeTab === 'complaints' && (
          <AdminDashboard
            onSelectComplaint={(c) => setSelectedComplaint(c)}
            onOpenOfficerUpdate={(c) => setOfficerUpdateComplaint(c)}
            onViewHotspotsTab={() => setActiveTab('hotspots')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200/80 bg-white py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">CivicConnect</span>
            <span>•</span>
            <span>Smart Civic Complaint Management System</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => setIsSchemaModalOpen(true)}
              className="text-blue-600 hover:underline font-medium"
            >
              PostgreSQL Schema & RLS
            </button>
            <span>•</span>
            <span>AI Multimodal Vision Assisted</span>
            <span>•</span>
            <span>Spatial Hotspot Clustering</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ComplaintFormModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />

      <ComplaintDetailsModal
        isOpen={!!selectedComplaint}
        complaint={selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
        onOpenOfficerUpdate={(c) => setOfficerUpdateComplaint(c)}
      />

      <OfficerUpdateModal
        isOpen={!!officerUpdateComplaint}
        complaint={officerUpdateComplaint}
        onClose={() => setOfficerUpdateComplaint(null)}
      />

      <SupabaseSchemaModal
        isOpen={isSchemaModalOpen}
        onClose={() => setIsSchemaModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <CivicProvider>
      <AppContent />
    </CivicProvider>
  );
}
