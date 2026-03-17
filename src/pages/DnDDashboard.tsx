import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import { FileWarning, History, Trash2, Plus, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../components/LtlCalculator';

export const DnDDashboard: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [audits, setAudits] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      if (!loading) navigate('/dnd');
      return;
    }

    const qAudits = query(collection(db, 'dnd_audits'), where('userId', '==', user.uid));
    const unsubscribeAudits = onSnapshot(qAudits, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAudits(data);
    });

    return () => {
      unsubscribeAudits();
    };
  }, [user, loading, navigate]);

  const handleDeleteAudit = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this audit record?')) return;
    try {
      await deleteDoc(doc(db, 'dnd_audits', id));
    } catch (error) {
      console.error('Error deleting audit', error);
      alert('Failed to delete audit.');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;
  if (!user) return null;

  const totalOvercharge = audits.reduce((sum, audit) => sum + (audit.estimatedOvercharge || 0), 0);
  const invalidAudits = audits.filter(a => !a.isValid).length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">D&D Auditor</h1>
        <Link 
          to="/dnd" 
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Audit
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <History className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Total Audits</h3>
          </div>
          <p className="text-3xl font-bold text-zinc-900">{audits.length}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Invalid Invoices</h3>
          </div>
          <p className="text-3xl font-bold text-red-600">{invalidAudits}</p>
        </div>

        <div className="bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-800 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-zinc-800 text-emerald-400 rounded-lg">
              <FileWarning className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Potential Recovery</h3>
          </div>
          <p className="text-3xl font-bold text-emerald-400">${totalOvercharge.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col min-h-[500px]">
        <div className="px-6 py-5 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900">Audit History</h2>
          <button 
            onClick={() => alert('Batch processing feature coming soon! (Mock)')}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            Batch Upload Invoices
          </button>
        </div>
        
        {audits.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 flex-1 flex flex-col items-center justify-center">
            <FileWarning className="w-12 h-12 text-zinc-200 mb-4" />
            <p className="mb-4">No invoices audited yet.</p>
            <Link to="/dnd" className="text-indigo-600 hover:text-indigo-700 font-medium">Audit your first invoice</Link>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 overflow-y-auto flex-1">
            {audits.map(audit => (
              <div key={audit.id} className="p-6 hover:bg-zinc-50 transition-colors group relative">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    {audit.isValid ? (
                      <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="w-8 h-8 text-red-500" />
                    )}
                    <div>
                      <h3 className="font-bold text-lg text-zinc-900 font-mono">{audit.containerNumber}</h3>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Audited on {format(new Date(audit.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteAudit(audit.id)}
                    className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                    title="Delete Audit"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                  <div className="bg-zinc-100 p-3 rounded-lg">
                    <span className="text-zinc-500 block text-[10px] uppercase tracking-wider mb-1">Total Billed</span>
                    <span className="font-medium text-zinc-900">${audit.totalBilled.toFixed(2)}</span>
                  </div>
                  <div className={cn("p-3 rounded-lg", audit.isValid ? "bg-emerald-50" : "bg-red-50")}>
                    <span className={cn("block text-[10px] uppercase tracking-wider mb-1", audit.isValid ? "text-emerald-700" : "text-red-700")}>Estimated Overcharge</span>
                    <span className={cn("font-bold", audit.isValid ? "text-emerald-700" : "text-red-700")}>${audit.estimatedOvercharge.toFixed(2)}</span>
                  </div>
                  <div className="bg-zinc-100 p-3 rounded-lg">
                    <span className="text-zinc-500 block text-[10px] uppercase tracking-wider mb-1">Billed Days</span>
                    <span className="font-medium text-zinc-900">{audit.billedDays}</span>
                  </div>
                  <div className="bg-zinc-100 p-3 rounded-lg">
                    <span className="text-zinc-500 block text-[10px] uppercase tracking-wider mb-1">Free Time</span>
                    <span className="font-medium text-zinc-900">{audit.freeTimeDays}</span>
                  </div>
                </div>

                {!audit.isValid && audit.issues && audit.issues.length > 0 && (
                  <div className="mt-4 p-3 bg-red-50/50 rounded-lg border border-red-100">
                    <p className="text-xs font-bold text-red-800 uppercase tracking-wider mb-2">Issues Detected</p>
                    <ul className="space-y-1">
                      {audit.issues.map((issue: string, idx: number) => (
                        <li key={idx} className="text-xs text-red-700 flex items-start gap-2">
                          <span className="w-1 h-1 rounded-full bg-red-500 mt-1.5 shrink-0"></span>
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
