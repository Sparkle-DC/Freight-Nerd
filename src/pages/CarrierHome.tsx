import React, { useState } from 'react';
import { Search, ShieldAlert, ShieldCheck, Shield, Download, Eye, Loader2, AlertTriangle } from 'lucide-react';
import { lookupCarrier, analyzeCarrierRisk, CarrierData, RiskAnalysis } from '../services/carrierService';
import { cn } from '../components/LtlCalculator';
import { useAuth } from '../AuthContext';
import { signInWithGoogle, db } from '../firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export const CarrierHome: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [carrier, setCarrier] = useState<CarrierData | null>(null);
  const [risk, setRisk] = useState<RiskAnalysis | null>(null);
  const [error, setError] = useState('');
  const [monitoring, setMonitoring] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError('');
    setCarrier(null);
    setRisk(null);

    try {
      const result = await lookupCarrier(searchQuery);
      if (result) {
        setCarrier(result);
        const analysis = analyzeCarrierRisk(result);
        setRisk(analysis);
      } else {
        setError('Carrier not found. Please check the MC/DOT number.');
      }
    } catch (err) {
      setError('An error occurred while looking up the carrier.');
    } finally {
      setLoading(false);
    }
  };

  const handleMonitor = async () => {
    if (!user) {
      if (window.confirm('You need to be signed in to monitor carriers. Sign in now?')) {
        signInWithGoogle();
      }
      return;
    }

    if (!carrier || !risk) return;

    setMonitoring(true);
    try {
      // Check if already monitoring
      const q = query(collection(db, 'monitored_carriers'), where('userId', '==', user.uid), where('mcNumber', '==', carrier.mcNumber));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        await addDoc(collection(db, 'monitored_carriers'), {
          userId: user.uid,
          mcNumber: carrier.mcNumber,
          dotNumber: carrier.dotNumber || '',
          name: carrier.name,
          riskScore: risk.score,
          status: carrier.status,
          createdAt: new Date().toISOString()
        });
        alert('Carrier added to watchlist!');
        navigate('/carrier-dashboard');
      } else {
        alert('You are already monitoring this carrier.');
      }
    } catch (err) {
      console.error('Error adding to watchlist', err);
      alert('Failed to add carrier to watchlist.');
    } finally {
      setMonitoring(false);
    }
  };

  const handleDownloadReport = () => {
    if (!user) {
      if (window.confirm('You need to be signed in to download vetting reports. Sign in now?')) {
        signInWithGoogle();
      }
      return;
    }
    // In MVP, we just alert. In full version, generate PDF.
    alert('Vetting report generated and downloaded! (Mock)');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full">
      <div className="text-center mb-10 max-w-3xl mx-auto px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-sm font-medium mb-6">
          <ShieldAlert className="w-4 h-4" />
          Carrier Vetting Monitor
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-zinc-900 tracking-tight mb-4">
          Avoid <span className="text-indigo-600">Risky Carriers</span> Instantly
        </h1>
        <p className="text-lg text-zinc-600">
          Detect fraud, double brokering, and compliance issues before booking loads.
        </p>
      </div>

      <div className="w-full max-w-2xl mx-auto px-4">
        <form onSubmit={handleSearch} className="relative mb-8">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-zinc-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-11 pr-32 py-4 bg-white border border-zinc-200 rounded-2xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm text-lg transition-shadow"
            placeholder="Enter MC, DOT, or Company Name..."
          />
          <div className="absolute inset-y-2 right-2 flex items-center">
            <button
              type="submit"
              disabled={loading || !searchQuery.trim()}
              className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Check Risk'}
            </button>
          </div>
        </form>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-xl text-center text-sm font-medium border border-red-100">
            {error}
          </div>
        )}

        {carrier && risk && (
          <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Risk Header */}
            <div className={cn(
              "p-6 border-b",
              risk.score === 'HIGH' ? "bg-red-50 border-red-100" :
              risk.score === 'MEDIUM' ? "bg-amber-50 border-amber-100" :
              "bg-emerald-50 border-emerald-100"
            )}>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold text-zinc-900">{carrier.name}</h2>
                <div className="flex items-center gap-2">
                  {risk.score === 'HIGH' ? <ShieldAlert className="w-6 h-6 text-red-600" /> :
                   risk.score === 'MEDIUM' ? <Shield className="w-6 h-6 text-amber-600" /> :
                   <ShieldCheck className="w-6 h-6 text-emerald-600" />}
                  <span className={cn(
                    "font-bold text-lg tracking-tight",
                    risk.score === 'HIGH' ? "text-red-700" :
                    risk.score === 'MEDIUM' ? "text-amber-700" :
                    "text-emerald-700"
                  )}>
                    {risk.score} RISK
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-zinc-600 font-mono">
                <span>MC: {carrier.mcNumber}</span>
                {carrier.dotNumber && <span>DOT: {carrier.dotNumber}</span>}
              </div>
            </div>

            {/* Signals */}
            <div className="p-6 border-b border-zinc-100">
              <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-4">Risk Signals Engine</h3>
              {risk.signals.length > 0 ? (
                <ul className="space-y-3">
                  {risk.signals.map((signal, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm">
                      <AlertTriangle className={cn(
                        "w-5 h-5 shrink-0",
                        risk.score === 'HIGH' ? "text-red-500" : "text-amber-500"
                      )} />
                      <span className="text-zinc-700 pt-0.5">{signal}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex items-center gap-3 text-sm text-emerald-700 bg-emerald-50/50 p-3 rounded-lg">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <span>No significant risk signals detected. Carrier appears established and compliant.</span>
                </div>
              )}
            </div>

            {/* Raw Data Summary */}
            <div className="p-6 bg-zinc-50">
              <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-4">Carrier Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-zinc-500 mb-1">Status</p>
                  <p className="font-medium text-zinc-900">{carrier.status}</p>
                </div>
                <div>
                  <p className="text-zinc-500 mb-1">Authority Age</p>
                  <p className="font-medium text-zinc-900">{carrier.authorityAgeDays} days</p>
                </div>
                <div>
                  <p className="text-zinc-500 mb-1">Insurance</p>
                  <p className="font-medium text-zinc-900">{carrier.insuranceStatus}</p>
                </div>
                <div>
                  <p className="text-zinc-500 mb-1">Safety Rating</p>
                  <p className="font-medium text-zinc-900">{carrier.safetyRating}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 flex flex-wrap gap-3 border-t border-zinc-100">
              <button 
                onClick={handleDownloadReport}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-sm font-medium rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Report
              </button>
              
              <button 
                onClick={handleMonitor}
                disabled={monitoring}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 shadow-sm"
              >
                <Eye className="w-4 h-4" />
                {monitoring ? 'Adding...' : 'Monitor Carrier'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
