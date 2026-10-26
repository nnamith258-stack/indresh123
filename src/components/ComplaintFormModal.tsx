import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Camera,
  MapPin,
  AlertTriangle,
  Upload,
  Check,
  Compass,
  Users,
  ChevronRight,
  ShieldAlert,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import { useCivic } from '../context/CivicContext';
import { Category, Severity, AIPredictionResult } from '../types';
import { SAMPLE_CIVIC_PHOTOS } from '../data/mockData';
import { DuplicateMatch } from '../utils/geo';
import { MapView } from './MapView';

interface ComplaintFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CATEGORIES: Category[] = [
  'Road Damage',
  'Garbage Management',
  'Water Leakage',
  'Drainage Issues',
  'Streetlight Problems',
  'Public Safety',
  'Other Civic Issues',
];

const SEVERITIES: Severity[] = ['Low', 'Medium', 'High', 'Critical'];

export const ComplaintFormModal: React.FC<ComplaintFormModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { createComplaint, checkDuplicates, supportExistingComplaint, analyzeWithAI, showToast } =
    useCivic();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('Road Damage');
  const [severity, setSeverity] = useState<Severity>('Medium');
  const [address, setAddress] = useState('4th St & Market Blvd, Downtown Central');
  const [latitude, setLatitude] = useState(37.7758);
  const [longitude, setLongitude] = useState(-122.418);
  const [imageUrl, setImageUrl] = useState(
    'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80'
  );
  const [publicSafetyRisk, setPublicSafetyRisk] = useState(false);

  // AI Analysis states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AIPredictionResult | null>(null);

  // Duplicate Detection states
  const [duplicateMatches, setDuplicateMatches] = useState<DuplicateMatch[]>([]);
  const [hasAcknowledgedDuplicates, setHasAcknowledgedDuplicates] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check for duplicates whenever location, category, or title changes
  useEffect(() => {
    if (!isOpen) return;

    if (title.length > 3 || description.length > 5) {
      const matches = checkDuplicates({
        title,
        description,
        category,
        latitude,
        longitude,
      });
      setDuplicateMatches(matches);
    } else {
      setDuplicateMatches([]);
    }
  }, [title, description, category, latitude, longitude, isOpen]);

  if (!isOpen) return null;

  // Handle GPS Auto-detect
  const handleDetectGPS = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(6));
          const lng = Number(pos.coords.longitude.toFixed(6));
          setLatitude(lat);
          setLongitude(lng);
          setAddress(`Current GPS Location (${lat}, ${lng})`);
          showToast('Current GPS coordinates captured!', 'success');
        },
        (err) => {
          showToast('Location permission denied or timed out. Defaulted to Metro Downtown.', 'warning');
        },
        { timeout: 8000 }
      );
    } else {
      showToast('Geolocation is not supported by your browser', 'error');
    }
  };

  // Handle Image File Upload (convert to base64)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const b64 = uploadEvent.target?.result as string;
      setImageUrl(b64);
      // Automatically trigger AI classification preview on upload
      runAIClassification(b64);
    };
    reader.readAsDataURL(file);
  };

  // Run AI Vision & Classification
  const runAIClassification = async (customImage?: string) => {
    setIsAnalyzing(true);
    setAiResult(null);

    const img = customImage || imageUrl;
    try {
      const result = await analyzeWithAI({
        imageBase64: img.startsWith('data:') ? img : undefined,
        descriptionText: `${title} ${description}`.trim(),
      });

      setAiResult(result);

      showToast(`AI Scan Complete: Identified as ${result.category} (${result.estimatedSeverity} Severity)`, 'success');
    } catch (e: any) {
      showToast('AI analysis error: ' + e?.message, 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 1-Click apply AI suggestions
  const handleApplyAISuggestions = () => {
    if (!aiResult) return;
    setCategory(aiResult.category);
    setTitle(aiResult.problemTitle);
    setDescription(aiResult.problemDescription);
    setSeverity(aiResult.estimatedSeverity);
    setPublicSafetyRisk(aiResult.publicSafetyRisk);
    showToast('AI suggestions applied to form fields!', 'info');
  };

  // Handle Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast('Please enter a complaint title', 'warning');
      return;
    }

    if (!description.trim()) {
      showToast('Please provide a detailed description', 'warning');
      return;
    }

    // If strong duplicates exist and user hasn't clicked continue anyway
    if (duplicateMatches.length > 0 && !hasAcknowledgedDuplicates) {
      showToast('Please review potential duplicate complaints below or confirm to submit anyway.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await createComplaint({
        title,
        description,
        category,
        severity,
        address,
        latitude,
        longitude,
        image_url: imageUrl,
        public_safety_risk: publicSafetyRisk,
        assigned_department: aiResult?.suggestedDepartment,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      showToast('Submission failed: ' + err?.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-white">Report a Civic Problem</h2>
              <p className="text-xs text-blue-100">
                AI Problem Classification & Real-Time Duplicate Prevention
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Quick Presets Bar for Hackathon / Testing */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Demo Sample Civic Scenarios (1-Click Test)
              </span>
              <span className="text-[11px] text-slate-500">Pick to test AI detection</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_CIVIC_PHOTOS.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setImageUrl(sample.url);
                    setTitle(sample.title);
                    setDescription(sample.description);
                    setCategory(sample.category as Category);
                    runAIClassification(sample.url);
                  }}
                  className="px-2.5 py-1 text-xs rounded-lg bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 text-slate-700 transition-colors shadow-2xs font-medium"
                >
                  {sample.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Image & AI Analysis */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    1. Photographic Evidence
                  </label>
                  <div className="relative rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-400 bg-slate-50/70 p-3 text-center transition-colors">
                    {imageUrl ? (
                      <div className="relative rounded-lg overflow-hidden group">
                        <img
                          src={imageUrl}
                          alt="Civic Issue Proof"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <label className="cursor-pointer bg-white/90 text-slate-800 text-xs px-3 py-1.5 rounded-lg font-semibold hover:bg-white transition-colors flex items-center gap-1.5 shadow-md">
                            <Upload className="w-3.5 h-3.5" /> Change Photo
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="py-8">
                        <ImageIcon className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                        <p className="text-xs text-slate-600 font-medium">
                          Upload image of the problem
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">PNG, JPG, or WEBP up to 10MB</p>
                        <label className="mt-3 inline-block cursor-pointer bg-blue-600 text-white text-xs px-3.5 py-1.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                          Browse File
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Problem Detection Action & Results Card */}
                <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50/70 to-indigo-50/40 p-3.5 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                        Feature 4: AI Problem Detection
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={isAnalyzing}
                      onClick={() => runAIClassification()}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Scanning...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" /> AI Scan Photo
                        </>
                      )}
                    </button>
                  </div>

                  {aiResult ? (
                    <div className="space-y-2 mt-2 bg-white/90 p-3 rounded-lg border border-blue-100 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800">
                          Detected: <span className="text-blue-700">{aiResult.category}</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium text-[10px]">
                          {Math.round(aiResult.confidenceScore * 100)}% Confidence
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px] italic">
                        "{aiResult.problemDescription}"
                      </p>
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-[11px]">
                        <div>
                          <span className="text-slate-400">Department:</span>{' '}
                          <strong className="text-slate-700">{aiResult.suggestedDepartment}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400">Severity:</span>{' '}
                          <strong className="text-red-600">{aiResult.estimatedSeverity}</strong>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleApplyAISuggestions}
                        className="w-full mt-2 py-1.5 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-xs border border-blue-200 transition-colors flex items-center justify-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> Accept AI Suggestions
                      </button>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500">
                      Our Gemini AI vision engine identifies problem categories, auto-generates hazard descriptions, and suggests responsible departments.
                    </p>
                  )}
                </div>

                {/* Severity & Safety Risk */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Severity Level
                    </label>
                    <select
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value as Severity)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      {SEVERITIES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col justify-end">
                    <label className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={publicSafetyRisk}
                        onChange={(e) => setPublicSafetyRisk(e.target.checked)}
                        className="rounded text-red-600 focus:ring-red-500 w-4 h-4"
                      />
                      <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5 text-red-500" /> Public Safety Hazard
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Right Column: Problem Details & Location Picker */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Complaint Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Category)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Problem Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Broken water pipeline flooding street"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Detailed Description *
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide exact landmarks, hazard extent, and community impact..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-none"
                    required
                  />
                </div>

                {/* Location Selection & Map Picker */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Location & Coordinates
                    </label>
                    <button
                      type="button"
                      onClick={handleDetectGPS}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <Compass className="w-3 h-3" /> Detect My GPS
                    </button>
                  </div>
                  <div className="relative mb-2">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Street name, landmark or intersection"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Mini Map to Pin Location */}
                  <div className="mt-2">
                    <MapView
                      complaints={[]}
                      interactiveLocationPicker={true}
                      initialCenter={[latitude, longitude]}
                      height="160px"
                      onLocationPick={(lat, lng) => {
                        setLatitude(lat);
                        setLongitude(lng);
                        setAddress(`Selected Pin (${lat}, ${lng})`);
                      }}
                    />
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                      <span>Coordinates: {latitude}, {longitude}</span>
                      <span className="text-blue-600 font-medium">Click map to adjust pin</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 1: Duplicate Complaint Detection Warning Box */}
            {duplicateMatches.length > 0 && (
              <div className="rounded-xl border-2 border-amber-300 bg-amber-50/80 p-4 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-amber-100 text-amber-800 shrink-0 mt-0.5">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs sm:text-sm font-bold text-amber-900">
                        Feature 1: Duplicate Complaint Detected Nearby! ({duplicateMatches.length} match
                        {duplicateMatches.length > 1 ? 'es' : ''})
                      </h4>
                      <span className="text-[11px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-semibold">
                        Saves City Resources
                      </span>
                    </div>
                    <p className="text-xs text-amber-800 mt-1">
                      Other citizens have already registered a very similar issue in this immediate vicinity.
                      Instead of creating a duplicate report, supporting the existing issue raises its priority score!
                    </p>

                    {/* Matching complaints list */}
                    <div className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-1">
                      {duplicateMatches.slice(0, 3).map((match) => (
                        <div
                          key={match.complaint.id}
                          className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-800">
                                {match.complaint.id}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">
                                {match.distanceMeters}m away
                              </span>
                              <span className="text-[10px] text-amber-700 font-semibold">
                                {match.overallMatchScore}% match
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-slate-700 line-clamp-1">
                              {match.complaint.title}
                            </p>
                            <p className="text-[11px] text-slate-500 line-clamp-1">
                              {match.complaint.address} • Status: <strong>{match.complaint.status}</strong>
                            </p>
                          </div>

                          {/* Quick Support Button */}
                          <button
                            type="button"
                            onClick={async () => {
                              await supportExistingComplaint(match.complaint.id);
                              onClose();
                            }}
                            className="shrink-0 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                          >
                            <Users className="w-3.5 h-3.5" />
                            Support This Report (+1)
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-amber-200 text-xs">
                      <span className="text-amber-800 text-[11px]">
                        Is your issue completely different?
                      </span>
                      <button
                        type="button"
                        onClick={() => setHasAcknowledgedDuplicates(true)}
                        className={`text-xs font-bold underline transition-colors ${
                          hasAcknowledgedDuplicates
                            ? 'text-emerald-700'
                            : 'text-amber-900 hover:text-black'
                        }`}
                      >
                        {hasAcknowledgedDuplicates
                          ? '✓ Confirmed as distinct issue'
                          : 'I still want to submit as new issue'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    <span>Submit Civic Complaint</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
