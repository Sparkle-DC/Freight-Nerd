import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Users, Clock, ArrowRight, Plus, Calculator, Box, ShieldAlert, DollarSign, FileWarning } from 'lucide-react';
import { format } from 'date-fns';

export const FuelDashboard: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  const [fuelSchedules, setFuelSchedules] = useState(0);
  const [ltlProfiles, setLtlProfiles] = useState(0);
  const [monitoredCarriers, setMonitoredCarriers] = useState(0);
  const [savedProducts, setSavedProducts] = useState(0);
  const [dndAudits, setDndAudits] = useState(0);

  useEffect(() => {
    if (!user) {
      if (!loading) navigate('/');
      return;
    }

    // Listeners for counts
    const unsubFuel = onSnapshot(query(collection(db, 'schedules'), where('userId', '==', user.uid)), (snap) => setFuelSchedules(snap.size));
    const unsubLtl = onSnapshot(query(collection(db, 'sku_profiles'), where('userId', '==', user.uid)), (snap) => setLtlProfiles(snap.size));
    const unsubCarrier = onSnapshot(query(collection(db, 'monitored_carriers'), where('userId', '==', user.uid)), (snap) => setMonitoredCarriers(snap.size));
    const unsubLanded = onSnapshot(query(collection(db, 'saved_products'), where('userId', '==', user.uid)), (snap) => setSavedProducts(snap.size));
    const unsubDnd = onSnapshot(query(collection(db, 'dnd_audits'), where('userId', '==', user.uid)), (snap) => setDndAudits(snap.size));

    return () => {
      unsubFuel();
      unsubLtl();
      unsubCarrier();
      unsubLanded();
      unsubDnd();
    };
  }, [user, loading, navigate]);

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;
  if (!user) return null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Your Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Fuel Surcharge */}
        <Link to="/fuel-dashboard" className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 hover:border-indigo-300 hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Calculator className="w-6 h-6" />
            </div>
            <ArrowRight className="w-5 h-5 text-zinc-300 group-hover:text-indigo-600 transition-colors" />
          </div>
          <h3 className="text-lg font-bold text-zinc-900 mb-1">Fuel Surcharge</h3>
          <p className="text-sm text-zinc-500 mb-4">Manage your automated fuel schedules.</p>
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-900">
            <span className="text-2xl">{fuelSchedules}</span> Active Schedules
          </div>
        </Link>

        {/* LTL Density */}
        <Link to="/ltl-dashboard" className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 hover:border-indigo-300 hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Box className="w-6 h-6" />
            </div>
            <ArrowRight className="w-5 h-5 text-zinc-300 group-hover:text-indigo-600 transition-colors" />
          </div>
          <h3 className="text-lg font-bold text-zinc-900 mb-1">LTL Density</h3>
          <p className="text-sm text-zinc-500 mb-4">Manage your saved SKU profiles.</p>
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-900">
            <span className="text-2xl">{ltlProfiles}</span> Saved SKUs
          </div>
        </Link>

        {/* Carrier Vetting */}
        <Link to="/carrier-dashboard" className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 hover:border-indigo-300 hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <ArrowRight className="w-5 h-5 text-zinc-300 group-hover:text-indigo-600 transition-colors" />
          </div>
          <h3 className="text-lg font-bold text-zinc-900 mb-1">Carrier Vetting</h3>
          <p className="text-sm text-zinc-500 mb-4">Monitor risk signals for your carriers.</p>
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-900">
            <span className="text-2xl">{monitoredCarriers}</span> Monitored Carriers
          </div>
        </Link>

        {/* Landed Cost */}
        <Link to="/landed-cost-dashboard" className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 hover:border-indigo-300 hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
            <ArrowRight className="w-5 h-5 text-zinc-300 group-hover:text-indigo-600 transition-colors" />
          </div>
          <h3 className="text-lg font-bold text-zinc-900 mb-1">Landed Cost</h3>
          <p className="text-sm text-zinc-500 mb-4">Manage your product catalog and estimates.</p>
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-900">
            <span className="text-2xl">{savedProducts}</span> Saved Products
          </div>
        </Link>

        {/* D&D Auditor */}
        <Link to="/dnd-dashboard" className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 hover:border-indigo-300 hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <FileWarning className="w-6 h-6" />
            </div>
            <ArrowRight className="w-5 h-5 text-zinc-300 group-hover:text-indigo-600 transition-colors" />
          </div>
          <h3 className="text-lg font-bold text-zinc-900 mb-1">D&D Auditor</h3>
          <p className="text-sm text-zinc-500 mb-4">Track your invoice audits and recoveries.</p>
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-900">
            <span className="text-2xl">{dndAudits}</span> Audits Performed
          </div>
        </Link>
      </div>
    </div>
  );
};
