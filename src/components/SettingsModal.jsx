import React, { useState } from 'react';
import {
  X,
  Cloud,
  CloudOff,
  Database,
  Trash2,
  Download,
  Upload,
  Volume2,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Save,
  HelpCircle
} from 'lucide-react';
import { useOrders } from '../context/OrdersContext';
import { getSavedFirebaseConfig } from '../services/firebase';
import { soundEffects } from '../utils/audio';

export default function SettingsModal({ onClose }) {
  const {
    isFirebaseEnabled,
    syncStatus,
    firebaseError,
    applyFirebaseConfig,
    clearAllData,
    orders
  } = useOrders();

  const [jsonConfig, setJsonConfig] = useState(() => {
    const existing = getSavedFirebaseConfig();
    return existing ? JSON.stringify(existing, null, 2) : '';
  });
  const [saveMessage, setSaveMessage] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showFirebaseGuide, setShowFirebaseGuide] = useState(false);

  const handleSaveFirebase = async (e) => {
    e.preventDefault();
    if (!jsonConfig.trim()) {
      await applyFirebaseConfig(null);
      setSaveMessage({ type: 'info', text: 'Switched to Local Offline Storage.' });
      return;
    }

    try {
      const parsed = JSON.parse(jsonConfig);
      if (!parsed.apiKey || !parsed.projectId) {
        setSaveMessage({
          type: 'error',
          text: 'Configuration must include apiKey and projectId.'
        });
        return;
      }
      const res = await applyFirebaseConfig(parsed);
      if (res.success) {
        setSaveMessage({ type: 'success', text: 'Firebase connected successfully!' });
      } else {
        setSaveMessage({ type: 'error', text: res.error || 'Failed to connect.' });
      }
    } catch {
      setSaveMessage({
        type: 'error',
        text: 'Invalid JSON format. Please paste valid Firebase config JSON.'
      });
    }
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(orders, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `moba_stall_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-rose-400" />
            <div>
              <h2 className="font-extrabold text-base">Stall Settings & Database</h2>
              <p className="text-xs text-slate-400">Firebase Firestore Cloud Sync & Data Controls</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-slate-700 text-sm">
          {/* Audio test */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <Volume2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-xs">Audio Cues</h4>
                <p className="text-[11px] text-slate-500">Chimes play on new order & order completion</p>
              </div>
            </div>
            <button
              onClick={() => soundEffects.playOrderPlaced()}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors"
            >
              Test Sound 🔔
            </button>
          </div>

          {/* Firebase Firestore Cloud Sync Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-indigo-600" />
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Firebase Firestore Cloud Sync
                </h3>
              </div>
              <span
                className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                  syncStatus === 'synced'
                    ? 'bg-emerald-100 text-emerald-800'
                    : syncStatus === 'connecting'
                    ? 'bg-amber-100 text-amber-800'
                    : syncStatus === 'error'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {syncStatus === 'synced'
                  ? 'Active & Synced'
                  : syncStatus === 'error'
                  ? 'Permission Error'
                  : syncStatus === 'connecting'
                  ? 'Connecting...'
                  : 'Local Storage Mode'}
              </span>
            </div>

            {firebaseError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-rose-800">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Firestore Security Rules Error</span>
                </div>
                <p className="text-[11px] text-rose-700 leading-relaxed">
                  Your web app connected to Firebase, but Cloud Firestore rejected access with:
                  <br />
                  <code className="bg-rose-100 font-mono px-1.5 py-0.5 rounded text-[10px] text-rose-800 inline-block mt-0.5">
                    {firebaseError}
                  </code>
                </p>
                <div className="bg-white p-3 rounded-xl border border-rose-200/80 text-[11px] space-y-1">
                  <p className="font-bold text-slate-900">How to fix in 10 seconds in Firebase Console:</p>
                  <ol className="list-decimal list-inside space-y-1 text-slate-600">
                    <li>Open your Firebase tab ➔ <strong>Firestore Database</strong> ➔ <strong>Rules</strong> tab.</li>
                    <li>Change the rule to allow read/write:</li>
                  </ol>
                  <pre className="text-[10px] bg-slate-900 text-emerald-300 p-2 rounded-lg font-mono overflow-x-auto mt-1">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`}
                  </pre>
                  <p className="text-[10px] text-slate-500">3. Click the blue <strong>Publish</strong> button at the top.</p>
                </div>
              </div>
            )}

            <p className="text-xs text-slate-500 leading-relaxed">
              By default, all orders save automatically in your browser's persistent LocalStorage (100% offline, zero setup needed).
              If you want <strong>real-time multi-device sync</strong> (so one phone at the stall counter takes orders while another phone in the kitchen shows live orders), connect a free Firebase Firestore project below.
            </p>

            <button
              type="button"
              onClick={() => setShowFirebaseGuide(!showFirebaseGuide)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{showFirebaseGuide ? 'Hide' : 'How to set up free Firebase in 2 minutes'}</span>
            </button>

            {showFirebaseGuide && (
              <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-900 space-y-1.5 leading-relaxed">
                <p className="font-bold">Quick 3-step setup:</p>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-indigo-800">
                  <li>Go to <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="underline font-bold inline-flex items-center gap-0.5">Firebase Console <ExternalLink className="w-2.5 h-2.5" /></a> and click "Add project".</li>
                  <li>Create a <strong>Cloud Firestore</strong> database in test mode (read/write enabled).</li>
                  <li>Click Project Settings (gear icon) &gt; Add Web App &gt; Copy the <code>firebaseConfig</code> object and paste it below.</li>
                </ol>
              </div>
            )}

            <form onSubmit={handleSaveFirebase} className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Paste Firebase Config (JSON):
              </label>
              <textarea
                rows={5}
                value={jsonConfig}
                onChange={(e) => setJsonConfig(e.target.value)}
                placeholder={`{\n  "apiKey": "AIzaSy...",\n  "authDomain": "my-app.firebaseapp.com",\n  "projectId": "my-app",\n  "storageBucket": "my-app.appspot.com",\n  "messagingSenderId": "123456",\n  "appId": "1:123:web:abc"\n}`}
                className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 text-slate-800"
              />

              {saveMessage && (
                <div
                  className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                    saveMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : saveMessage.type === 'error'
                      ? 'bg-rose-50 text-rose-800 border border-rose-200'
                      : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  {saveMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{saveMessage.text}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save & Connect Firebase</span>
                </button>

                {isFirebaseEnabled && (
                  <button
                    type="button"
                    onClick={async () => {
                      setJsonConfig('');
                      await applyFirebaseConfig(null);
                      setSaveMessage({ type: 'info', text: 'Switched to Local Offline Storage.' });
                    }}
                    className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs transition-colors"
                  >
                    Disconnect Cloud
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Data Backup & Reset */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <h3 className="font-extrabold text-slate-900 text-sm">
              Data Management & Festival Reset
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleExportJSON}
                className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4 text-slate-500" />
                <span>Download JSON Backup</span>
              </button>

              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="py-2.5 px-3 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
                <span>Clear All Orders</span>
              </button>
            </div>

            {showClearConfirm && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 space-y-2">
                <p className="text-xs font-bold">
                  Are you sure you want to clear all orders? This cannot be undone.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      clearAllData();
                      setShowClearConfirm(false);
                      setSaveMessage({ type: 'info', text: 'All orders cleared.' });
                    }}
                    className="px-3 py-1.5 rounded-lg bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition-colors"
                  >
                    Yes, Clear All
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(false)}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
          >
            Close Settings
          </button>
        </div>
      </div>
    </div>
  );
}
