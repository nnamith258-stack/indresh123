import React, { useState } from 'react';
import { X, HardHat, CheckCircle2, Upload, FileCheck, Image as ImageIcon } from 'lucide-react';
import { Complaint, ComplaintStatus } from '../types';
import { useCivic } from '../context/CivicContext';

interface OfficerUpdateModalProps {
  complaint: Complaint | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const SAMPLE_PROOF_PHOTOS = [
  {
    label: 'Repaired Asphalt Pavement',
    url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=80',
    notes: 'Hot-mix asphalt laid and compacted with vibratory roller. Surface level verified.',
  },
  {
    label: 'Cleared Waste & Sanitized Dumpster',
    url: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&auto=format&fit=crop&q=80',
    notes: 'Bulk compactor emptied primary dumpster. Footpath washed and sanitized with disinfectant.',
  },
  {
    label: 'Replaced LED Luminaire Fixture',
    url: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&auto=format&fit=crop&q=80',
    notes: 'Replaced burnt driver unit and tested illumination lux levels across crosswalk.',
  },
  {
    label: 'Repaired Pipe Joint & Restored Pressure',
    url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
    notes: 'Fitted heavy-duty mechanical repair clamp and restored mainline pressure to 4.2 bar.',
  },
];

export const OfficerUpdateModal: React.FC<OfficerUpdateModalProps> = ({
  complaint,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentUser, updateComplaintStatus, showToast } = useCivic();

  const [status, setStatus] = useState<ComplaintStatus>('In Progress');
  const [remarks, setRemarks] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [assignedDepartment, setAssignedDepartment] = useState('');
  const [assignedOfficerName, setAssignedOfficerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync with selected complaint on open
  React.useEffect(() => {
    if (complaint) {
      setStatus(complaint.status === 'Submitted' ? 'In Progress' : complaint.status);
      setAssignedDepartment(complaint.assigned_department);
      setAssignedOfficerName(complaint.assigned_officer_name || currentUser.full_name);
      setProofUrl(complaint.resolution_proof_url || '');
      setRemarks(complaint.resolution_notes || '');
    }
  }, [complaint, currentUser]);

  if (!isOpen || !complaint) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      setProofUrl(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!remarks.trim()) {
      showToast('Please add official progress or resolution remarks', 'warning');
      return;
    }

    if (status === 'Resolved' && !proofUrl) {
      showToast('Please upload or select proof of work completed before marking Resolved', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateComplaintStatus(complaint.id, status, remarks, {
        assigned_department: assignedDepartment,
        assigned_officer: currentUser.id,
        assigned_officer_name: assignedOfficerName,
        resolution_proof_url: proofUrl || null,
        resolution_notes: remarks,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      showToast('Update failed: ' + err?.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <HardHat className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Department Officer Action Panel</h3>
              <p className="text-[11px] text-slate-400">Updating Complaint {complaint.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Target Issue Overview */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="font-semibold text-slate-800">{complaint.title}</div>
            <div className="text-slate-500 text-[11px]">{complaint.address}</div>
          </div>

          {/* Status Selection */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Transition Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Under Review', 'In Progress', 'Resolved'] as ComplaintStatus[]).map((st) => (
                <button
                  type="button"
                  key={st}
                  onClick={() => setStatus(st)}
                  className={`py-2 px-3 rounded-xl font-bold text-xs border text-center transition-all ${
                    status === st
                      ? st === 'Resolved'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Assigned Officer */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Department
              </label>
              <input
                type="text"
                value={assignedDepartment}
                onChange={(e) => setAssignedDepartment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Officer In Charge
              </label>
              <input
                type="text"
                value={assignedOfficerName}
                onChange={(e) => setAssignedOfficerName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Remarks & Technical Notes */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Resolution & Field Notes *
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Detail the materials used, crew deployed, and current site status..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 resize-none"
              required
            />
          </div>

          {/* Proof of Work Photo */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Proof of Resolution (Photo)
            </label>
            <div className="space-y-2">
              {proofUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-200 aspect-video max-h-40">
                  <img src={proofUrl} alt="Resolution Proof" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setProofUrl('')}
                    className="absolute top-2 right-2 p-1 rounded-full bg-slate-900/70 text-white hover:bg-slate-900"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="border border-dashed border-slate-300 rounded-xl p-3 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-500">
                    <ImageIcon className="w-5 h-5 text-slate-400" />
                    <span>Upload completion photograph</span>
                  </div>
                  <label className="cursor-pointer bg-white border border-slate-200 text-slate-700 font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-100 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" /> Browse
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              )}

              {/* Sample Proof presets for demo testing */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 block mb-1">
                  1-Click Sample Resolution Proofs:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {SAMPLE_PROOF_PHOTOS.map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setProofUrl(p.url);
                        setRemarks(p.notes);
                        setStatus('Resolved');
                      }}
                      className="px-2 py-1 rounded bg-white border border-slate-200 hover:border-blue-400 text-[11px] text-slate-700 font-medium"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20 disabled:opacity-50 transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" /> Save Official Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
