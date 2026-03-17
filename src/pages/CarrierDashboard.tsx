import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, ShieldCheck, Shield, Eye, FileText, Trash2, Plus, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../components/LtlCalculator';

export const CarrierDashboard: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [monitoredCarriers, setMonitoredCarriers] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [activeCarrier, setActiveCarrier] = useState<any | null>(null);
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    if (!user) {
      if (!loading) navigate('/carrier');
      return;
    }

    const qCarriers = query(collection(db, 'monitored_carriers'), where('userId', '==', user.uid));
    const unsubscribeCarriers = onSnapshot(qCarriers, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setMonitoredCarriers(data);
      if (data.length > 0 && !activeCarrier) {
        setActiveCarrier(data[0]);
      }
    });

    const qNotes = query(collection(db, 'carrier_notes'), where('userId', '==', user.uid));
    const unsubscribeNotes = onSnapshot(qNotes, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setNotes(data);
    });

    return () => {
      unsubscribeCarriers();
      unsubscribeNotes();
    };
  }, [user, loading, navigate]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeCarrier || !newNote.trim()) return;

    setSavingNote(true);
    try {
      await addDoc(collection(db, 'carrier_notes'), {
        userId: user.uid,
        mcNumber: activeCarrier.mcNumber,
        note: newNote.trim(),
        createdAt: new Date().toISOString()
      });
      setNewNote('');
    } catch (error) {
      console.error('Error adding note', error);
      alert('Failed to add note.');
    } finally {
      setSavingNote(false);
    }
  };

  const handleRemoveCarrier = async (id: string) => {
    if (!window.confirm('Are you sure you want to stop monitoring this carrier?')) return;
    try {
      await deleteDoc(doc(db, 'monitored_carriers', id));
      if (activeCarrier?.id === id) {
        setActiveCarrier(null);
      }
    } catch (error) {
      console.error('Error removing carrier', error);
      alert('Failed to remove carrier.');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;
  if (!user) return null;

  const activeNotes = notes.filter(n => n.mcNumber === activeCarrier?.mcNumber);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Carrier Vetting Monitor</h1>
        <Link 
          to="/carrier" 
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Check New Carrier
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Watchlist Sidebar */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col h-[600px]">
          <div className="px-6 py-5 border-b border-zinc-200 bg-zinc-50 flex items-center gap-2">
            <Eye className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-zinc-900">Watchlist</h2>
          </div>
          
          {monitoredCarriers.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 flex-1 flex flex-col items-center justify-center">
              <Shield className="w-12 h-12 text-zinc-200 mb-4" />
              <p className="mb-4">No carriers monitored yet.</p>
              <Link to="/carrier" className="text-indigo-600 hover:text-indigo-700 font-medium">Search for a carrier</Link>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 overflow-y-auto flex-1">
              {monitoredCarriers.map(carrier => (
                <button
                  key={carrier.id}
                  onClick={() => setActiveCarrier(carrier)}
                  className={cn(
                    "w-full text-left p-4 hover:bg-zinc-50 transition-colors flex items-start justify-between group",
                    activeCarrier?.id === carrier.id ? "bg-indigo-50/50 border-l-4 border-indigo-600" : "border-l-4 border-transparent"
                  )}
                >
                  <div>
                    <h3 className="font-medium text-zinc-900 truncate pr-4">{carrier.name}</h3>
                    <p className="text-xs text-zinc-500 font-mono mt-1">MC: {carrier.mcNumber}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full",
                        carrier.riskScore === 'HIGH' ? "bg-red-100 text-red-700" :
                        carrier.riskScore === 'MEDIUM' ? "bg-amber-100 text-amber-700" :
                        "bg-emerald-100 text-emerald-700"
                      )}>
                        {carrier.riskScore} RISK
                      </span>
                    </div>
                  </div>
                  <div 
                    onClick={(e) => { e.stopPropagation(); handleRemoveCarrier(carrier.id); }}
                    className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                    title="Remove from watchlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Active Carrier Details & Notes */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {activeCarrier ? (
            <>
              {/* Carrier Header */}
              <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
                <div className={cn(
                  "p-6 border-b",
                  activeCarrier.riskScore === 'HIGH' ? "bg-red-50 border-red-100" :
                  activeCarrier.riskScore === 'MEDIUM' ? "bg-amber-50 border-amber-100" :
                  "bg-emerald-50 border-emerald-100"
                )}>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-2xl font-bold text-zinc-900">{activeCarrier.name}</h2>
                    <div className="flex items-center gap-2">
                      {activeCarrier.riskScore === 'HIGH' ? <ShieldAlert className="w-6 h-6 text-red-600" /> :
                       activeCarrier.riskScore === 'MEDIUM' ? <Shield className="w-6 h-6 text-amber-600" /> :
                       <ShieldCheck className="w-6 h-6 text-emerald-600" />}
                      <span className={cn(
                        "font-bold text-lg tracking-tight",
                        activeCarrier.riskScore === 'HIGH' ? "text-red-700" :
                        activeCarrier.riskScore === 'MEDIUM' ? "text-amber-700" :
                        "text-emerald-700"
                      )}>
                        {activeCarrier.riskScore} RISK
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-zinc-600 font-mono">
                    <span>MC: {activeCarrier.mcNumber}</span>
                    {activeCarrier.dotNumber && <span>DOT: {activeCarrier.dotNumber}</span>}
                    <span className="ml-auto flex items-center gap-1 text-xs text-zinc-500">
                      <Eye className="w-3 h-3" /> Monitored since {format(new Date(activeCarrier.createdAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
                
                <div className="p-6 bg-zinc-50 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-1">Status</h3>
                    <p className="font-medium text-zinc-900">{activeCarrier.status}</p>
                  </div>
                  <button 
                    onClick={() => alert('Vetting report generated and downloaded! (Mock)')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-900 text-sm font-medium rounded-lg transition-colors shadow-sm"
                  >
                    <FileText className="w-4 h-4" />
                    Download Latest Report
                  </button>
                </div>
              </div>

              {/* Notes Section */}
              <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden flex-1 flex flex-col">
                <div className="px-6 py-5 border-b border-zinc-200 bg-zinc-50 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-lg font-semibold text-zinc-900">Internal Notes</h2>
                </div>
                
                <div className="p-6 flex-1 overflow-y-auto">
                  {activeNotes.length === 0 ? (
                    <div className="text-center text-zinc-500 py-8">
                      <p>No notes for this carrier yet.</p>
                      <p className="text-sm mt-1">Add notes about performance, late deliveries, or specific loads.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activeNotes.map(note => (
                        <div key={note.id} className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                          <p className="text-zinc-800 text-sm whitespace-pre-wrap">{note.note}</p>
                          <p className="text-xs text-zinc-400 mt-2">
                            {format(new Date(note.createdAt), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-6 border-t border-zinc-100 bg-zinc-50">
                  <form onSubmit={handleAddNote} className="flex gap-3">
                    <input
                      type="text"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add a note (e.g., 'Used for load 123', 'Late delivery')..."
                      className="flex-1 px-4 py-2 bg-white border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                    />
                    <button
                      type="submit"
                      disabled={savingNote || !newNote.trim()}
                      className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                    >
                      {savingNote ? 'Adding...' : 'Add Note'}
                    </button>
                  </form>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 h-full flex flex-col items-center justify-center p-12 text-center text-zinc-500">
              <Shield className="w-16 h-16 text-zinc-200 mb-4" />
              <h3 className="text-lg font-medium text-zinc-900 mb-2">Select a Carrier</h3>
              <p>Choose a carrier from your watchlist to view details and notes.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
