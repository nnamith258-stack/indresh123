import React, { useState } from 'react';
import {
  Bell,
  Shield,
  UserCheck,
  Building2,
  HardHat,
  Database,
  RotateCcw,
  PlusCircle,
  CheckCheck,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { useCivic } from '../context/CivicContext';

interface HeaderProps {
  onOpenReportModal: () => void;
  onOpenSchemaModal: () => void;
  activeTab: 'dashboard' | 'map' | 'hotspots' | 'complaints';
  setActiveTab: (tab: 'dashboard' | 'map' | 'hotspots' | 'complaints') => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenReportModal,
  onOpenSchemaModal,
  activeTab,
  setActiveTab,
}) => {
  const {
    currentUser,
    switchRole,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    resetToDemoData,
  } = useCivic();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const unreadNotifs = notifications.filter((n) => !n.is_read);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">CivicConnect</span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  <Sparkles className="w-2.5 h-2.5 text-blue-600" /> Smart Gov
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Intelligent Municipal Complaint & Hotspot Tracking
              </p>
            </div>
          </div>

          {/* Navigation Tabs for Views */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-white text-blue-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'map'
                  ? 'bg-white text-blue-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Live Map
            </button>
            <button
              onClick={() => setActiveTab('hotspots')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'hotspots'
                  ? 'bg-white text-blue-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Repeat Hotspots
            </button>
            <button
              onClick={() => setActiveTab('complaints')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'complaints'
                  ? 'bg-white text-blue-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Complaints
            </button>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Report Button */}
            <button
              onClick={onOpenReportModal}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-xl shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden xs:inline">Report a Problem</span>
              <span className="xs:hidden">Report</span>
            </button>

            {/* Architecture / Database Modal Button */}
            <button
              onClick={onOpenSchemaModal}
              title="View Supabase Database Architecture & SQL Schema"
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
            >
              <Database className="w-4 h-4" />
            </button>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifs.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadNotifs.length}
                  </span>
                )}
              </button>

              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      Notifications ({unreadNotifs.length} unread)
                    </span>
                    {unreadNotifs.length > 0 && (
                      <button
                        onClick={markAllNotificationsRead}
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                      >
                        <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.slice(0, 8).map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => markNotificationRead(notif.id)}
                          className={`p-3 hover:bg-slate-50 cursor-pointer transition-colors ${
                            !notif.is_read ? 'bg-blue-50/50' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-semibold text-slate-900">
                              {notif.title}
                            </span>
                            {!notif.is_read && (
                              <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1"></span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                            {notif.message}
                          </p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {new Date(notif.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/60 hover:bg-slate-100 transition-colors"
              >
                <img
                  src={
                    currentUser.avatar_url ||
                    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
                  }
                  alt={currentUser.full_name}
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-blue-500/20"
                />
                <div className="text-left hidden lg:block">
                  <div className="text-xs font-semibold text-slate-800 leading-tight">
                    {currentUser.full_name}
                  </div>
                  <div className="text-[10px] text-slate-500 capitalize flex items-center gap-1">
                    {currentUser.role === 'admin' ? (
                      <Shield className="w-2.5 h-2.5 text-indigo-600" />
                    ) : currentUser.role === 'officer' ? (
                      <HardHat className="w-2.5 h-2.5 text-amber-600" />
                    ) : (
                      <UserCheck className="w-2.5 h-2.5 text-emerald-600" />
                    )}
                    {currentUser.role}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Role Switching Dropdown */}
              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-xs">
                  <div className="px-3 py-1.5 border-b border-slate-100">
                    <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">
                      Switch Role (Demo Persona)
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      switchRole('citizen');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full px-3 py-2 text-left flex items-center gap-2.5 hover:bg-slate-50 transition-colors ${
                      currentUser.role === 'citizen' ? 'bg-blue-50/70 text-blue-700 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div>Sarah Jenkins (Citizen)</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        Submit & support complaints
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      switchRole('admin');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full px-3 py-2 text-left flex items-center gap-2.5 hover:bg-slate-50 transition-colors ${
                      currentUser.role === 'admin' ? 'bg-blue-50/70 text-blue-700 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <Shield className="w-4 h-4 text-indigo-600" />
                    <div>
                      <div>Comm. Verma (Admin)</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        Assign, escalate & analytics
                      </div>
                    </div>
                  </button>

                  <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 border-t border-slate-100 mt-1">
                    Department Officers
                  </div>

                  <button
                    onClick={() => {
                      switchRole('officer', 'Public Works');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-slate-50 transition-colors ${
                      currentUser.role === 'officer' && currentUser.department?.includes('Public')
                        ? 'bg-blue-50/70 text-blue-700 font-semibold'
                        : 'text-slate-700'
                    }`}
                  >
                    <HardHat className="w-3.5 h-3.5 text-amber-600" />
                    <div>Eng. David Chen (PWD)</div>
                  </button>

                  <button
                    onClick={() => {
                      switchRole('officer', 'Solid Waste');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-slate-50 transition-colors ${
                      currentUser.role === 'officer' && currentUser.department?.includes('Waste')
                        ? 'bg-blue-50/70 text-blue-700 font-semibold'
                        : 'text-slate-700'
                    }`}
                  >
                    <HardHat className="w-3.5 h-3.5 text-emerald-600" />
                    <div>Officer Maya Patel (SWM)</div>
                  </button>

                  <button
                    onClick={() => {
                      switchRole('officer', 'Water');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-slate-50 transition-colors ${
                      currentUser.role === 'officer' && currentUser.department?.includes('Water')
                        ? 'bg-blue-50/70 text-blue-700 font-semibold'
                        : 'text-slate-700'
                    }`}
                  >
                    <HardHat className="w-3.5 h-3.5 text-sky-600" />
                    <div>Eng. Marcus Brody (Water)</div>
                  </button>

                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      onClick={() => {
                        resetToDemoData();
                        setShowRoleMenu(false);
                      }}
                      className="w-full px-3 py-1.5 text-left text-slate-500 hover:text-rose-600 flex items-center gap-2 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Demo Seed Data</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Subnav for Views */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-100 text-xs">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-1 px-2.5 rounded-md font-medium ${
              activeTab === 'dashboard' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`py-1 px-2.5 rounded-md font-medium ${
              activeTab === 'map' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600'
            }`}
          >
            Map
          </button>
          <button
            onClick={() => setActiveTab('hotspots')}
            className={`py-1 px-2.5 rounded-md font-medium ${
              activeTab === 'hotspots' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600'
            }`}
          >
            Hotspots
          </button>
          <button
            onClick={() => setActiveTab('complaints')}
            className={`py-1 px-2.5 rounded-md font-medium ${
              activeTab === 'complaints' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600'
            }`}
          >
            Complaints
          </button>
        </div>
      </div>
    </header>
  );
};
