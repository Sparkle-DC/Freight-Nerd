import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy, onSnapshot, addDoc } from 'firebase/firestore';
import { ArrowLeft, Copy, Download, Share2, Calculator as CalcIcon, Plus, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Calculator } from '../components/Calculator';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const ScheduleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [fuelIndex, setFuelIndex] = useState<any[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!user || !id) return;

    const fetchSchedule = async () => {
      try {
        const docRef = doc(db, 'schedules', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().userId === user.uid) {
          setSchedule({ id: docSnap.id, ...docSnap.data() });
          
          const custRef = doc(db, 'customers', docSnap.data().customerId);
          const custSnap = await getDoc(custRef);
          if (custSnap.exists()) {
            setCustomer({ id: custSnap.id, ...custSnap.data() });
          }
        } else {
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Error fetching schedule', error);
      }
    };

    fetchSchedule();

    const qSnapshots = query(collection(db, 'schedule_snapshots'), where('scheduleId', '==', id));
    const unsubscribeSnapshots = onSnapshot(qSnapshots, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setSnapshots(data);
    });

    const qFuel = query(collection(db, 'fuel_index'), orderBy('effectiveDate', 'desc'));
    const unsubscribeFuel = onSnapshot(qFuel, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFuelIndex(data);
    });

    return () => {
      unsubscribeSnapshots();
      unsubscribeFuel();
    };
  }, [user, id, navigate]);

  const handleUpdateSnapshot = async () => {
    if (!schedule || !fuelIndex.length || !user) return;
    
    setIsUpdating(true);
    try {
      const latestIndex = fuelIndex[0];
      const difference = Math.max(0, latestIndex.price - schedule.baselineFuelPrice);
      const surchargePerMile = difference / schedule.mpg;
      const adjustedRate = schedule.baseRate + surchargePerMile;
      const surchargePercentage = schedule.baseRate > 0 ? (surchargePerMile / schedule.baseRate) * 100 : 0;

      await addDoc(collection(db, 'schedule_snapshots'), {
        userId: user.uid,
        scheduleId: schedule.id,
        fuelIndexId: latestIndex.id,
        surchargePerMile,
        surchargePercentage,
        adjustedRate,
        effectiveDate: latestIndex.effectiveDate,
        createdAt: new Date().toISOString()
      });
      
      alert('Snapshot updated successfully!');
    } catch (error) {
      console.error('Error updating snapshot', error);
      alert('Failed to update snapshot.');
    } finally {
      setIsUpdating(false);
    }
  };

  const exportPDF = async (snapshot: any) => {
    const element = document.getElementById(`snapshot-card-${snapshot.id}`);
    if (!element) return;

    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Fuel_Surcharge_${customer?.name}_${format(new Date(snapshot.effectiveDate), 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF', error);
    }
  };

  const copyLink = (snapshotId: string) => {
    const url = `${window.location.origin}/client/${snapshotId}`;
    navigator.clipboard.writeText(url);
    alert('Client link copied to clipboard!');
  };

  if (loading || !schedule) return <div className="flex justify-center items-center h-64">Loading...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 mb-8">
        <Link to="/dashboard" className="p-2 text-zinc-400 hover:text-zinc-600 transition-colors rounded-full hover:bg-zinc-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">{schedule.name}</h1>
          <p className="text-zinc-500 mt-1">Customer: {customer?.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
            <h3 className="text-lg font-semibold text-zinc-900 mb-4 flex items-center gap-2">
              <CalcIcon className="w-5 h-5 text-indigo-600" />
              Configuration
            </h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between border-b border-zinc-100 pb-2">
                <span className="text-zinc-500">Base Rate</span>
                <span className="font-medium text-zinc-900">${schedule.baseRate.toFixed(2)}/mi</span>
              </div>
              <div className="flex justify-between border-b border-zinc-100 pb-2">
                <span className="text-zinc-500">Baseline Fuel</span>
                <span className="font-medium text-zinc-900">${schedule.baselineFuelPrice.toFixed(2)}/gal</span>
              </div>
              <div className="flex justify-between border-b border-zinc-100 pb-2">
                <span className="text-zinc-500">MPG</span>
                <span className="font-medium text-zinc-900">{schedule.mpg}</span>
              </div>
              <div className="flex justify-between pb-2">
                <span className="text-zinc-500">Created</span>
                <span className="font-medium text-zinc-900">{format(new Date(schedule.createdAt), 'MMM d, yyyy')}</span>
              </div>
            </div>
            
            <button 
              onClick={handleUpdateSnapshot}
              disabled={isUpdating || !fuelIndex.length}
              className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              Generate New Snapshot
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-zinc-900 tracking-tight">Version History</h2>
          
          {snapshots.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl shadow-sm border border-zinc-200 text-zinc-500">
              No snapshots generated yet.
            </div>
          ) : (
            <div className="space-y-6">
              {snapshots.map((snapshot, index) => {
                const isLatest = index === 0;
                const indexData = fuelIndex.find(f => f.id === snapshot.fuelIndexId);
                
                return (
                  <div 
                    key={snapshot.id} 
                    id={`snapshot-card-${snapshot.id}`}
                    className={`bg-white rounded-2xl shadow-sm border ${isLatest ? 'border-indigo-200 ring-1 ring-indigo-50' : 'border-zinc-200'} overflow-hidden`}
                  >
                    <div className={`px-6 py-4 border-b flex items-center justify-between ${isLatest ? 'bg-indigo-50/50 border-indigo-100' : 'bg-zinc-50 border-zinc-200'}`}>
                      <div>
                        <h3 className="font-semibold text-zinc-900 flex items-center gap-2">
                          Effective: {format(new Date(snapshot.effectiveDate), 'MMM d, yyyy')}
                          {isLatest && <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full font-medium">Latest</span>}
                        </h3>
                        <p className="text-xs text-zinc-500 mt-1">Generated on {format(new Date(snapshot.createdAt), 'MMM d, yyyy HH:mm')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => copyLink(snapshot.id)}
                          className="p-2 text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Copy Client Link"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => exportPDF(snapshot)}
                          className="p-2 text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Export PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                        <div>
                          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Fuel Index</p>
                          <p className="text-lg font-semibold text-zinc-900">${indexData?.price?.toFixed(2) || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Surcharge / Mi</p>
                          <p className="text-lg font-semibold text-zinc-900">${snapshot.surchargePerMile.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Surcharge %</p>
                          <p className="text-lg font-semibold text-indigo-600">{snapshot.surchargePercentage.toFixed(2)}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Adjusted Rate</p>
                          <p className="text-lg font-bold text-zinc-900">${snapshot.adjustedRate.toFixed(2)}</p>
                        </div>
                      </div>
                      
                      <div className="bg-zinc-50 rounded-lg p-4 text-sm text-zinc-600">
                        <p className="font-medium text-zinc-900 mb-2">Calculation Breakdown</p>
                        <div className="space-y-1 font-mono text-xs">
                          <p>Base Rate: ${schedule.baseRate.toFixed(2)}/mi</p>
                          <p>Baseline Fuel: ${schedule.baselineFuelPrice.toFixed(2)}/gal</p>
                          <p>Current Fuel: ${indexData?.price?.toFixed(2) || 'N/A'}/gal</p>
                          <p>MPG: {schedule.mpg}</p>
                          <div className="border-t border-zinc-200 my-2 pt-2">
                            <p>Difference: ${Math.max(0, (indexData?.price || 0) - schedule.baselineFuelPrice).toFixed(2)}/gal</p>
                            <p>Surcharge: Difference / MPG = ${snapshot.surchargePerMile.toFixed(2)}/mi</p>
                            <p className="font-bold text-zinc-900 mt-1">Final Rate: ${snapshot.adjustedRate.toFixed(2)}/mi</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
