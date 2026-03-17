import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import { Box, History, AlertTriangle, Plus, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../components/LtlCalculator';

export const LtlDashboard: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [skuProfiles, setSkuProfiles] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      if (!loading) navigate('/ltl');
      return;
    }

    const qSkus = query(collection(db, 'sku_profiles'), where('userId', '==', user.uid));
    const unsubscribeSkus = onSnapshot(qSkus, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSkuProfiles(data);
    });

    const qHistory = query(collection(db, 'shipment_history'), where('userId', '==', user.uid));
    const unsubscribeHistory = onSnapshot(qHistory, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setHistory(data);
    });

    return () => {
      unsubscribeSkus();
      unsubscribeHistory();
    };
  }, [user, loading, navigate]);

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;
  if (!user) return null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">LTL Density Pro</h1>
        <Link 
          to="/ltl" 
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Calculation
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Box className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Saved SKUs</h3>
          </div>
          <p className="text-3xl font-bold text-zinc-900">{skuProfiles.length}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <History className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Total Calculations</h3>
          </div>
          <p className="text-3xl font-bold text-zinc-900">{history.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* SKUs */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-zinc-200 bg-zinc-50">
            <h2 className="text-lg font-semibold text-zinc-900">Saved SKU Profiles</h2>
          </div>
          
          {skuProfiles.length === 0 ? (
            <div className="p-12 text-center text-zinc-500">
              <p className="mb-4">No saved SKUs yet.</p>
              <Link to="/ltl" className="text-indigo-600 hover:text-indigo-700 font-medium">Create your first SKU</Link>
            </div>
          ) : (
            <div className="divide-y divide-zinc-200">
              {skuProfiles.map(sku => (
                <div key={sku.id} className="p-6 hover:bg-zinc-50 transition-colors">
                  <h3 className="text-lg font-medium text-zinc-900">{sku.sku}</h3>
                  <div className="grid grid-cols-2 gap-4 mt-3 text-sm text-zinc-600">
                    <div>
                      <span className="text-zinc-400">Dims:</span> {sku.length}x{sku.width}x{sku.height} in
                    </div>
                    <div>
                      <span className="text-zinc-400">Weight:</span> {sku.weight} lbs
                    </div>
                    <div>
                      <span className="text-zinc-400">Handling:</span> {sku.packagingType}
                    </div>
                    <div>
                      <span className="text-zinc-400">Stackable:</span> {sku.stackable ? 'Yes' : 'No'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* History */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-zinc-200 bg-zinc-50">
            <h2 className="text-lg font-semibold text-zinc-900">Recent Calculations</h2>
          </div>
          
          {history.length === 0 ? (
            <div className="p-12 text-center text-zinc-500">
              <p>No calculation history.</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-200 max-h-[600px] overflow-y-auto">
              {history.map(item => (
                <div key={item.id} className="p-6 hover:bg-zinc-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-zinc-900">Class {item.estimatedClass}</span>
                      <span className="text-xs text-zinc-500">• {item.density.toFixed(2)} PCF</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {item.riskScore === 'HIGH' ? <AlertTriangle className="w-4 h-4 text-red-600" /> :
                       item.riskScore === 'MEDIUM' ? <AlertTriangle className="w-4 h-4 text-amber-600" /> :
                       <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      <span className={cn(
                        "text-xs font-medium",
                        item.riskScore === 'HIGH' ? "text-red-700" :
                        item.riskScore === 'MEDIUM' ? "text-amber-700" :
                        "text-emerald-700"
                      )}>
                        {item.riskScore} RISK
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-zinc-500 mb-2">
                    {format(new Date(item.createdAt), 'MMM d, yyyy HH:mm')}
                  </div>
                  <div className="text-sm text-zinc-600 font-mono bg-zinc-100 p-2 rounded">
                    {item.length}x{item.width}x{item.height} @ {item.weight}lbs ({item.units} units)
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
