import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import { Network, History, ArrowRight, CheckCircle2, Building2, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { MOCK_PROVIDERS, Provider } from '../services/matchmakerService';

export const MatchmakerDashboard: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [leads, setLeads] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      if (!loading) navigate('/matchmaker');
      return;
    }

    const qLeads = query(collection(db, '3pl_leads'), where('userId', '==', user.uid));
    const unsubscribeLeads = onSnapshot(qLeads, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setLeads(data);
    });

    return () => {
      unsubscribeLeads();
    };
  }, [user, loading, navigate]);

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;
  if (!user) return null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">3PL Matchmaker</h1>
        <Link 
          to="/matchmaker" 
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
        >
          <Network className="w-4 h-4" />
          New Match Search
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <History className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Total Searches</h3>
          </div>
          <p className="text-3xl font-bold text-zinc-900">{leads.length}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Quotes Requested</h3>
          </div>
          <p className="text-3xl font-bold text-emerald-600">{leads.filter(l => l.status === 'quotes_requested').length}</p>
        </div>

        <div className="bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-800 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-zinc-800 text-indigo-400 rounded-lg">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Matched Partners</h3>
          </div>
          <p className="text-3xl font-bold text-indigo-400">
            {new Set(leads.flatMap(l => l.matchedProviders)).size}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col min-h-[500px]">
        <div className="px-6 py-5 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900">Match History</h2>
        </div>
        
        {leads.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 flex-1 flex flex-col items-center justify-center">
            <Network className="w-12 h-12 text-zinc-200 mb-4" />
            <p className="mb-4">You haven't searched for any 3PL partners yet.</p>
            <Link to="/matchmaker" className="text-indigo-600 hover:text-indigo-700 font-medium">Find your ideal 3PL</Link>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 overflow-y-auto flex-1">
            {leads.map(lead => {
              const matchedProviders = lead.matchedProviders.map((id: string) => MOCK_PROVIDERS.find(p => p.id === id)).filter(Boolean) as Provider[];
              
              return (
                <div key={lead.id} className="p-6 hover:bg-zinc-50 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-zinc-900">
                        {lead.requirements.volume} orders/mo • {lead.requirements.productType}
                      </h3>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Searched on {format(new Date(lead.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {matchedProviders.length} Matches
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm mb-6">
                    <div className="bg-zinc-100 p-3 rounded-lg">
                      <span className="text-zinc-500 block text-[10px] uppercase tracking-wider mb-1">Regions</span>
                      <span className="font-medium text-zinc-900">{lead.requirements.regions.join(', ')}</span>
                    </div>
                    <div className="bg-zinc-100 p-3 rounded-lg">
                      <span className="text-zinc-500 block text-[10px] uppercase tracking-wider mb-1">Platforms</span>
                      <span className="font-medium text-zinc-900">{lead.requirements.platforms.join(', ')}</span>
                    </div>
                    <div className="bg-zinc-100 p-3 rounded-lg">
                      <span className="text-zinc-500 block text-[10px] uppercase tracking-wider mb-1">Avg Weight</span>
                      <span className="font-medium text-zinc-900">{lead.requirements.avgWeight}</span>
                    </div>
                    <div className="bg-zinc-100 p-3 rounded-lg">
                      <span className="text-zinc-500 block text-[10px] uppercase tracking-wider mb-1">Special Needs</span>
                      <span className="font-medium text-zinc-900">{lead.requirements.specialNeeds.join(', ') || 'None'}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Matched Partners</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {matchedProviders.map(provider => (
                        <div key={provider.id} className="flex items-center gap-3 p-3 border border-zinc-200 rounded-lg bg-white">
                          <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-md flex items-center justify-center shrink-0">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-zinc-900 truncate">{provider.name}</p>
                            <div className="flex items-center gap-1 text-xs text-zinc-500 truncate">
                              <MapPin className="w-3 h-3 shrink-0" />
                              <span className="truncate">{provider.locations.join(', ')}</span>
                            </div>
                          </div>
                          <button 
                            className="text-xs font-medium text-indigo-600 hover:text-indigo-700 px-2 py-1 rounded-md hover:bg-indigo-50 transition-colors"
                            onClick={() => alert(`Contacting ${provider.name}...`)}
                          >
                            Contact
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
