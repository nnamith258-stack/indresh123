import React, { useState } from 'react';
import {
  X,
  Database,
  Copy,
  Check,
  ShieldCheck,
  Download,
  Key,
  Server,
  Layers,
  Code2,
} from 'lucide-react';
import { useCivic } from '../context/CivicContext';

interface SupabaseSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COMPLETE_SUPABASE_SQL = `-- CivicConnect Smart Civic Complaint Management System
-- Complete PostgreSQL / Supabase Schema, Foreign Keys & Row Level Security (RLS) Policies

-- 1. Create Enums
CREATE TYPE user_role AS ENUM ('citizen', 'admin', 'officer');
CREATE TYPE complaint_status AS ENUM ('Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Rejected');
CREATE TYPE priority_level AS ENUM ('Low', 'Medium', 'High', 'Critical');
CREATE TYPE complaint_severity AS ENUM ('Low', 'Medium', 'High', 'Critical');

-- 2. Profiles Table (extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role user_role DEFAULT 'citizen' NOT NULL,
    department TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Complaints Table
CREATE TABLE public.complaints (
    id TEXT PRIMARY KEY DEFAULT ('CC-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(FLOOR(RANDOM()*10000)::TEXT, 4, '0')),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    image_url TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    address TEXT NOT NULL,
    severity complaint_severity NOT NULL DEFAULT 'Medium',
    public_safety_risk BOOLEAN NOT NULL DEFAULT false,
    priority_score INTEGER NOT NULL CHECK (priority_score BETWEEN 0 AND 100),
    priority_level priority_level NOT NULL DEFAULT 'Medium',
    status complaint_status NOT NULL DEFAULT 'Submitted',
    assigned_department TEXT NOT NULL,
    assigned_officer UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    assigned_officer_name TEXT,
    deadline TIMESTAMPTZ NOT NULL,
    resolved_at TIMESTAMPTZ,
    resolution_proof_url TEXT,
    resolution_notes TEXT,
    support_count INTEGER NOT NULL DEFAULT 1,
    supporters JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_escalated BOOLEAN NOT NULL DEFAULT false,
    escalation_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Complaint Supports (Duplicate mitigation)
CREATE TABLE public.complaint_supports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id TEXT NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(complaint_id, user_id)
);

-- 5. Complaint Updates (Official audit log trail)
CREATE TABLE public.complaint_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id TEXT NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    updated_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    updated_by_name TEXT NOT NULL,
    role user_role NOT NULL,
    status complaint_status NOT NULL,
    remarks TEXT NOT NULL,
    proof_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. Notifications Table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    complaint_id TEXT REFERENCES public.complaints(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. Recurring Problem Areas Table (Hotspots)
CREATE TABLE public.recurring_problem_areas (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    address TEXT NOT NULL,
    complaint_count INTEGER NOT NULL,
    recurrence_period TEXT NOT NULL,
    risk_level TEXT NOT NULL,
    complaint_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    root_cause_analysis TEXT NOT NULL,
    recommendation TEXT NOT NULL,
    last_updated TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 8. Spatial and Performance Indexes
CREATE INDEX idx_complaints_geo ON public.complaints (latitude, longitude);
CREATE INDEX idx_complaints_status ON public.complaints (status);
CREATE INDEX idx_complaints_priority ON public.complaints (priority_score DESC);
CREATE INDEX idx_complaints_deadline ON public.complaints (deadline);
CREATE INDEX idx_complaints_user ON public.complaints (user_id);
CREATE INDEX idx_hotspots_category ON public.recurring_problem_areas (category);

-- 9. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_supports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_problem_areas ENABLE ROW LEVEL SECURITY;

-- 10. RLS Policies
-- Profiles: Any authenticated user can read profiles; users can update own profile
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Complaints: Everyone can view complaints; Citizens can insert; Citizens can update only their own in 'Submitted'; Admins & Officers can update all
CREATE POLICY "Complaints are viewable by everyone" ON public.complaints FOR SELECT USING (true);
CREATE POLICY "Authenticated users can submit complaints" ON public.complaints FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Citizens can update own submitted complaints" ON public.complaints FOR UPDATE USING (
    auth.uid() = user_id AND status = 'Submitted'
);
CREATE POLICY "Admins and officers can update all complaints" ON public.complaints FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'officer'))
);

-- Updates: Admins and officers can post audit updates
CREATE POLICY "Updates viewable by everyone" ON public.complaint_updates FOR SELECT USING (true);
CREATE POLICY "Officers and admins can insert updates" ON public.complaint_updates FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'officer'))
);

-- Notifications: Users can only see and mark their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
`;

export const SupabaseSchemaModal: React.FC<SupabaseSchemaModalProps> = ({ isOpen, onClose }) => {
  const { complaints, updates, notifications, hotspots, showToast } = useCivic();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'sql' | 'tables' | 'rls' | 'export'>('tables');

  if (!isOpen) return null;

  const handleCopySQL = () => {
    navigator.clipboard.writeText(COMPLETE_SUPABASE_SQL);
    setCopied(true);
    showToast('Complete Supabase PostgreSQL DDL copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleExportJSON = () => {
    const data = {
      system: 'CivicConnect',
      exported_at: new Date().toISOString(),
      complaints,
      updates,
      notifications,
      hotspots,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `civicconnect_export_${Date.now()}.json`;
    a.click();
    showToast('Exported active dataset as JSON', 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Database & Supabase Architecture</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold">
                  Dual Mode: Local Persistence + PostgreSQL Schema
                </span>
              </div>
              <p className="text-xs text-slate-400">
                PostgreSQL Tables, Foreign Keys, RLS Security Policies & Live State
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('tables')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                activeTab === 'tables' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Table Schema (6 Tables)
            </button>
            <button
              onClick={() => setActiveTab('rls')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                activeTab === 'rls' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Row Level Security (RLS)
            </button>
            <button
              onClick={() => setActiveTab('sql')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                activeTab === 'sql' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Copyable SQL Migration
            </button>
          </div>

          <button
            onClick={handleExportJSON}
            className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold flex items-center gap-1.5 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" /> Export JSON
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {activeTab === 'tables' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                <div className="font-bold text-slate-800 flex items-center justify-between">
                  <span>1. profiles</span>
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500">auth.users</span>
                </div>
                <p className="text-slate-500 text-[11px]">Stores user personas (citizens, department officers, administrators)</p>
                <div className="bg-slate-50 p-2 rounded text-[11px] font-mono text-slate-700 space-y-0.5">
                  <div>id: UUID (PK)</div>
                  <div>full_name: TEXT</div>
                  <div>email: TEXT (UNIQUE)</div>
                  <div>phone: TEXT</div>
                  <div>role: user_role ('citizen','admin','officer')</div>
                  <div>department: TEXT</div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                <div className="font-bold text-slate-800 flex items-center justify-between">
                  <span>2. complaints</span>
                  <span className="text-[10px] bg-blue-100 px-2 py-0.5 rounded text-blue-700">Primary Entity</span>
                </div>
                <p className="text-slate-500 text-[11px]">Core civic complaints with GPS coordinates, priority score, and SLA deadline</p>
                <div className="bg-slate-50 p-2 rounded text-[11px] font-mono text-slate-700 space-y-0.5">
                  <div>id: TEXT (PK, e.g. CC-2026-1041)</div>
                  <div>user_id: UUID (FK profiles.id)</div>
                  <div>title, description, category: TEXT</div>
                  <div>latitude, longitude: FLOAT</div>
                  <div>priority_score: INT (0-100)</div>
                  <div>priority_level: Low | Medium | High | Critical</div>
                  <div>status: Submitted | In Progress | Resolved</div>
                  <div>deadline: TIMESTAMPTZ</div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                <div className="font-bold text-slate-800 flex items-center justify-between">
                  <span>3. complaint_supports</span>
                  <span className="text-[10px] bg-emerald-100 px-2 py-0.5 rounded text-emerald-700">Feature 1: Duplicate Prevention</span>
                </div>
                <p className="text-slate-500 text-[11px]">Allows citizens to back existing issues instead of creating spam duplicates</p>
                <div className="bg-slate-50 p-2 rounded text-[11px] font-mono text-slate-700 space-y-0.5">
                  <div>id: UUID (PK)</div>
                  <div>complaint_id: TEXT (FK complaints.id)</div>
                  <div>user_id: UUID (FK profiles.id)</div>
                  <div>created_at: TIMESTAMPTZ</div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                <div className="font-bold text-slate-800 flex items-center justify-between">
                  <span>4. complaint_updates</span>
                  <span className="text-[10px] bg-amber-100 px-2 py-0.5 rounded text-amber-800">Audit Trail</span>
                </div>
                <p className="text-slate-500 text-[11px]">Official timeline logs of status updates, remarks, and resolution proof photos</p>
                <div className="bg-slate-50 p-2 rounded text-[11px] font-mono text-slate-700 space-y-0.5">
                  <div>id: UUID (PK)</div>
                  <div>complaint_id: TEXT (FK complaints.id)</div>
                  <div>updated_by: UUID (FK profiles.id)</div>
                  <div>status: complaint_status</div>
                  <div>remarks: TEXT</div>
                  <div>proof_url: TEXT</div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                <div className="font-bold text-slate-800 flex items-center justify-between">
                  <span>5. notifications</span>
                  <span className="text-[10px] bg-indigo-100 px-2 py-0.5 rounded text-indigo-700">Alerts</span>
                </div>
                <p className="text-slate-500 text-[11px]">Real-time alerts for citizens and SLA breach notifications for admins</p>
                <div className="bg-slate-50 p-2 rounded text-[11px] font-mono text-slate-700 space-y-0.5">
                  <div>id: UUID (PK)</div>
                  <div>user_id: UUID (FK profiles.id)</div>
                  <div>title, message, type: TEXT</div>
                  <div>is_read: BOOLEAN</div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                <div className="font-bold text-slate-800 flex items-center justify-between">
                  <span>6. recurring_problem_areas</span>
                  <span className="text-[10px] bg-red-100 px-2 py-0.5 rounded text-red-700">Feature 5: Hotspots</span>
                </div>
                <p className="text-slate-500 text-[11px]">Spatial clustering of recurring potholes, drainage choke-points, and water leaks</p>
                <div className="bg-slate-50 p-2 rounded text-[11px] font-mono text-slate-700 space-y-0.5">
                  <div>id: TEXT (PK)</div>
                  <div>category, address: TEXT</div>
                  <div>latitude, longitude: FLOAT</div>
                  <div>complaint_count: INT</div>
                  <div>risk_level: Moderate | High | Severe</div>
                  <div>recommendation: TEXT</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'rls' && (
            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Row Level Security (RLS) Rules
                </h4>
                <p className="text-slate-600">
                  Enforces role-based security to ensure citizens can only update their own complaints
                  prior to dispatch, while municipal administrators and verified department officers
                  hold authority to reassign, change status, and close reports.
                </p>
              </div>

              <div className="space-y-2">
                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <div className="font-bold text-slate-800">Citizens Role Access:</div>
                  <ul className="list-disc list-inside text-slate-600 space-y-1 mt-1 text-[11px]">
                    <li>Can read all public complaints in the city.</li>
                    <li>Can insert new complaints with valid user_id = auth.uid().</li>
                    <li>Can update their own complaints only when status is 'Submitted'.</li>
                    <li>Can support any active complaint (+1 support).</li>
                  </ul>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <div className="font-bold text-slate-800">Administrator Role Access:</div>
                  <ul className="list-disc list-inside text-slate-600 space-y-1 mt-1 text-[11px]">
                    <li>Full read and write privileges across all tables.</li>
                    <li>Can assign complaints to specific departments and officers.</li>
                    <li>Can adjust SLA deadlines and trigger emergency escalations.</li>
                  </ul>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <div className="font-bold text-slate-800">Department Officer Role Access:</div>
                  <ul className="list-disc list-inside text-slate-600 space-y-1 mt-1 text-[11px]">
                    <li>Can update progress and upload proof photos for assigned complaints.</li>
                    <li>Can transition status from 'In Progress' to 'Resolved'.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sql' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">
                  Run this SQL in the Supabase SQL Editor to provision all tables, indexes, and RLS rules:
                </span>
                <button
                  onClick={handleCopySQL}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy SQL Migration'}
                </button>
              </div>

              <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-[11px] font-mono overflow-x-auto max-h-96 leading-relaxed border border-slate-800">
                {COMPLETE_SUPABASE_SQL}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
          <div className="text-slate-500 flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-600" />
            <span>Dual mode: Active Local Storage + Ready for Cloud Supabase deployment</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
