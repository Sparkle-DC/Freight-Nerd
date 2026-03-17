import React, { useState, useEffect } from 'react';
import { Calculator, CalcData } from '../components/Calculator';
import { useAuth } from '../AuthContext';
import { signInWithGoogle, db } from '../firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';

export const Home: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [calcDataToSave, setCalcDataToSave] = useState<CalcData | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [scheduleName, setScheduleName] = useState('');
  const [saving, setSaving] = useState(false);
  const [latestFuelIndex, setLatestFuelIndex] = useState<{ id: string; price: number; effectiveDate: string } | null>(null);

  useEffect(() => {
    // Fetch the latest fuel index to use as default
    const fetchLatestIndex = async () => {
      try {
        const q = query(collection(db, 'fuel_index'), orderBy('effectiveDate', 'desc'), limit(1));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          setLatestFuelIndex({ id: doc.id, ...doc.data() } as any);
        } else {
          // Seed a default fuel index for testing
          if (user && isAdmin) {
            const newIndexRef = await addDoc(collection(db, 'fuel_index'), {
              price: 4.10,
              source: 'EIA National Average',
              effectiveDate: new Date().toISOString(),
              createdAt: new Date().toISOString()
            });
            setLatestFuelIndex({ id: newIndexRef.id, price: 4.10, effectiveDate: new Date().toISOString() });
          }
        }
      } catch (error) {
        console.error('Error fetching latest fuel index', error);
      }
    };
    fetchLatestIndex();
  }, [user, isAdmin]);

  const handleSaveClick = (data: CalcData) => {
    if (!user) {
      // Prompt login
      if (window.confirm('You need to be signed in to save schedules. Sign in now?')) {
        signInWithGoogle();
      }
      return;
    }
    setCalcDataToSave(data);
    setIsModalOpen(true);
  };

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !calcDataToSave) return;
    
    setSaving(true);
    try {
      // 1. Create Customer
      const customerRef = await addDoc(collection(db, 'customers'), {
        userId: user.uid,
        name: customerName,
        createdAt: new Date().toISOString()
      });

      // 2. Create Schedule
      const scheduleRef = await addDoc(collection(db, 'schedules'), {
        userId: user.uid,
        customerId: customerRef.id,
        name: scheduleName,
        baseRate: calcDataToSave.baseRate,
        baselineFuelPrice: calcDataToSave.baselineFuelPrice,
        mpg: calcDataToSave.mpg,
        createdAt: new Date().toISOString()
      });

      // 3. Create Snapshot
      await addDoc(collection(db, 'schedule_snapshots'), {
        userId: user.uid,
        scheduleId: scheduleRef.id,
        fuelIndexId: latestFuelIndex?.id || 'manual',
        surchargePerMile: calcDataToSave.surchargePerMile,
        surchargePercentage: calcDataToSave.surchargePercentage,
        adjustedRate: calcDataToSave.adjustedRate,
        effectiveDate: latestFuelIndex?.effectiveDate || new Date().toISOString(),
        createdAt: new Date().toISOString()
      });

      setIsModalOpen(false);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving schedule', error);
      alert('Failed to save schedule. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full">
      <div className="text-center mb-12 max-w-2xl mx-auto px-4">
        <h1 className="text-4xl md:text-5xl font-extrabold text-zinc-900 tracking-tight mb-4">
          Calculate Fuel Surcharges <span className="text-indigo-600">Instantly</span>
        </h1>
        <p className="text-lg text-zinc-600">
          No login required to calculate. Save your schedules, track history, and export professional PDFs for your clients.
        </p>
      </div>

      <Calculator 
        onSave={handleSaveClick} 
        initialData={{
          currentFuelPrice: latestFuelIndex?.price || 4.10
        }}
      />

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-zinc-100">
              <h3 className="text-lg font-semibold text-zinc-900">Save Schedule</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Customer Name</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="e.g. Acme Logistics"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Schedule Name</label>
                <input
                  type="text"
                  required
                  value={scheduleName}
                  onChange={(e) => setScheduleName(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="e.g. Q3 Dedicated Lane"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-sm font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
