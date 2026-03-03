import React, { useState, useEffect } from 'react';
import { Cloud, CloudOff, RefreshCw, CheckCircle, AlertCircle, LogOut, Download, Upload } from 'lucide-react';

interface CloudBackupProps {
  onRestore: (data: any) => void;
  onBackup: () => any;
}

const CloudBackup: React.FC<CloudBackupProps> = ({ onRestore, onBackup }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);

  useEffect(() => {
    checkStatus();
    
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) return;
      
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        checkStatus();
        setStatus({ type: 'success', message: 'Successfully connected to Google Drive!' });
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const checkStatus = async () => {
    try {
      const res = await fetch('/api/auth/status');
      const data = await res.json();
      setIsConnected(data.connected);
    } catch (err) {
      console.error('Failed to check auth status', err);
    }
  };

  const handleConnect = async () => {
    try {
      const res = await fetch('/api/auth/google/url');
      const { url } = await res.json();
      window.open(url, 'google_oauth', 'width=600,height=700');
    } catch (err) {
      setStatus({ type: 'error', message: 'Failed to start connection process.' });
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setIsConnected(false);
      setStatus({ type: 'info', message: 'Disconnected from Google Drive.' });
    } catch (err) {
      setStatus({ type: 'error', message: 'Failed to disconnect.' });
    }
  };

  const handleBackup = async () => {
    setIsLoading(true);
    setStatus(null);
    try {
      const data = onBackup();
      const res = await fetch('/api/backup/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      });
      
      if (res.ok) {
        setStatus({ type: 'success', message: 'Backup successfully uploaded to Google Drive!' });
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Upload failed');
      }
    } catch (err: any) {
      setStatus({ type: 'error', message: `Backup failed: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!window.confirm("This will overwrite your current local data with the cloud backup. Continue?")) return;
    
    setIsLoading(true);
    setStatus(null);
    try {
      const res = await fetch('/api/backup/download');
      if (res.ok) {
        const { data } = await res.json();
        onRestore(data);
        setStatus({ type: 'success', message: 'Data successfully restored from Google Drive!' });
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Download failed');
      }
    } catch (err: any) {
      setStatus({ type: 'error', message: `Restore failed: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isConnected ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
            <Cloud size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Cloud Backup</h3>
            <p className="text-sm text-slate-500">Secure your data on Google Drive</p>
          </div>
        </div>
        {isConnected && (
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-rose-500 transition-colors"
          >
            <LogOut size={16} />
            <span>Disconnect</span>
          </button>
        )}
      </div>

      {!isConnected ? (
        <div className="text-center py-8">
          <div className="mb-4 flex justify-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
              <CloudOff size={32} />
            </div>
          </div>
          <p className="text-slate-600 mb-6 max-w-xs mx-auto">
            Connect your Google account to enable automatic backups and sync across devices.
          </p>
          <button
            onClick={handleConnect}
            className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center gap-2 mx-auto"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
            Connect Google Drive
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleBackup}
              disabled={isLoading}
              className="flex flex-col items-center justify-center p-6 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 hover:bg-emerald-100 transition-all disabled:opacity-50"
            >
              {isLoading ? <RefreshCw size={24} className="animate-spin mb-2" /> : <Upload size={24} className="mb-2" />}
              <span className="font-bold">Backup Now</span>
            </button>
            <button
              onClick={handleRestore}
              disabled={isLoading}
              className="flex flex-col items-center justify-center p-6 bg-indigo-50 text-indigo-700 rounded-2xl border border-indigo-100 hover:bg-indigo-100 transition-all disabled:opacity-50"
            >
              {isLoading ? <RefreshCw size={24} className="animate-spin mb-2" /> : <Download size={24} className="mb-2" />}
              <span className="font-bold">Restore Data</span>
            </button>
          </div>
          
          <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-500 flex items-start gap-2">
            <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
            <p>
              Your data is stored in a private folder on your Google Drive. SpendWise only has access to files it creates.
            </p>
          </div>
        </div>
      )}

      {status && (
        <div className={`mt-6 p-4 rounded-xl flex items-center gap-3 ${
          status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
          status.type === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
          'bg-blue-50 text-blue-700 border border-blue-100'
        }`}>
          {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <p className="text-sm font-medium">{status.message}</p>
        </div>
      )}
    </div>
  );
};

export default CloudBackup;
