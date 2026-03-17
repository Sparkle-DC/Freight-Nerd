import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Truck, Download, FileText } from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const ClientPortal: React.FC = () => {
  const { snapshotId } = useParams<{ snapshotId: string }>();
  const [snapshot, setSnapshot] = useState<any>(null);
  const [schedule, setSchedule] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [fuelIndex, setFuelIndex] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!snapshotId) return;
      try {
        const snapRef = doc(db, 'schedule_snapshots', snapshotId);
        const snapDoc = await getDoc(snapRef);
        
        if (!snapDoc.exists()) {
          setError('Snapshot not found.');
          setLoading(false);
          return;
        }
        
        const snapData = { id: snapDoc.id, ...snapDoc.data() } as any;
        setSnapshot(snapData);

        const schedRef = doc(db, 'schedules', snapData.scheduleId);
        const schedDoc = await getDoc(schedRef);
        if (schedDoc.exists()) {
          const schedData = { id: schedDoc.id, ...schedDoc.data() } as any;
          setSchedule(schedData);

          const custRef = doc(db, 'customers', schedData.customerId);
          const custDoc = await getDoc(custRef);
          if (custDoc.exists()) {
            setCustomer({ id: custDoc.id, ...custDoc.data() });
          }
        }

        if (snapData.fuelIndexId !== 'manual') {
          const fuelRef = doc(db, 'fuel_index', snapData.fuelIndexId);
          const fuelDoc = await getDoc(fuelRef);
          if (fuelDoc.exists()) {
            setFuelIndex({ id: fuelDoc.id, ...fuelDoc.data() });
          }
        }
      } catch (err) {
        console.error('Error fetching data', err);
        setError('Failed to load data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [snapshotId]);

  const exportPDF = async () => {
    const element = document.getElementById('client-report');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Fuel_Surcharge_Report_${format(new Date(snapshot.effectiveDate), 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-zinc-500">Loading report...</div>
      </div>
    );
  }

  if (error || !snapshot || !schedule) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200 text-center max-w-md w-full">
          <FileText className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-zinc-900 mb-2">Report Unavailable</h2>
          <p className="text-zinc-500">{error || 'This fuel surcharge report could not be found.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xl tracking-tight">
            <Truck className="w-6 h-6" />
            <span>Fuel Surcharge Pro</span>
          </div>
          <button 
            onClick={exportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>

        <div id="client-report" className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
          <div className="bg-zinc-900 px-8 py-10 text-white">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Fuel Surcharge Report</h1>
                <p className="text-zinc-400 text-lg">{schedule.name}</p>
              </div>
              <div className="text-left md:text-right">
                <p className="text-sm text-zinc-400 uppercase tracking-wider mb-1">Effective Date</p>
                <p className="text-xl font-medium">{format(new Date(snapshot.effectiveDate), 'MMMM d, yyyy')}</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            {customer && (
              <div className="mb-10 pb-8 border-b border-zinc-100">
                <p className="text-sm text-zinc-500 uppercase tracking-wider mb-2">Prepared For</p>
                <p className="text-xl font-semibold text-zinc-900">{customer.name}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-10">
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 mb-6 border-b border-zinc-100 pb-2">Calculation Inputs</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Base Rate</span>
                    <span className="font-medium text-zinc-900">${schedule.baseRate.toFixed(2)}/mi</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Baseline Fuel Price</span>
                    <span className="font-medium text-zinc-900">${schedule.baselineFuelPrice.toFixed(2)}/gal</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Current Fuel Index</span>
                    <span className="font-medium text-zinc-900">${fuelIndex?.price?.toFixed(2) || 'N/A'}/gal</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Fuel Efficiency (MPG)</span>
                    <span className="font-medium text-zinc-900">{schedule.mpg}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-zinc-900 mb-6 border-b border-zinc-100 pb-2">Final Results</h3>
                <div className="space-y-6">
                  <div className="flex justify-between items-end">
                    <span className="text-zinc-500">Surcharge Percentage</span>
                    <span className="text-2xl font-semibold text-indigo-600">{snapshot.surchargePercentage.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-zinc-500">Surcharge Amount</span>
                    <span className="text-xl font-medium text-zinc-900">+${snapshot.surchargePerMile.toFixed(2)}/mi</span>
                  </div>
                  <div className="flex justify-between items-end pt-4 border-t border-zinc-200">
                    <span className="text-zinc-900 font-medium text-lg">Adjusted Rate</span>
                    <span className="text-3xl font-bold text-zinc-900">${snapshot.adjustedRate.toFixed(2)}/mi</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-zinc-50 rounded-xl p-6 text-sm text-zinc-600">
              <h4 className="font-semibold text-zinc-900 mb-3">Methodology</h4>
              <p className="mb-2">The fuel surcharge is calculated based on the difference between the current fuel index and the agreed baseline fuel price, divided by the vehicle's fuel efficiency (MPG).</p>
              <div className="font-mono text-xs bg-white p-4 rounded border border-zinc-200">
                <p>Difference = Current Fuel (${fuelIndex?.price?.toFixed(2) || 'N/A'}) - Baseline (${schedule.baselineFuelPrice.toFixed(2)})</p>
                <p>Surcharge = Difference / MPG ({schedule.mpg}) = ${snapshot.surchargePerMile.toFixed(2)}/mi</p>
                <p>Adjusted Rate = Base Rate (${schedule.baseRate.toFixed(2)}) + Surcharge (${snapshot.surchargePerMile.toFixed(2)})</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center text-sm text-zinc-400">
          Generated via Fuel Surcharge Pro
        </div>
      </div>
    </div>
  );
};
