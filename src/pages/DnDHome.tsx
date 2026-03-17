import React, { useState } from 'react';
import { FileText, Upload, AlertTriangle, CheckCircle2, FileWarning, Download, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { auditInvoice, DnDAuditResult } from '../services/dndService';
import { cn } from '../components/LtlCalculator';
import { useAuth } from '../AuthContext';
import { signInWithGoogle, db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export const DnDHome: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [containerNumber, setContainerNumber] = useState('');
  const [availabilityDate, setAvailabilityDate] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [freeTimeDays, setFreeTimeDays] = useState('');
  const [billedDays, setBilledDays] = useState('');
  const [dailyRate, setDailyRate] = useState('');
  const [totalBilled, setTotalBilled] = useState('');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DnDAuditResult | null>(null);
  const [saving, setSaving] = useState(false);

  // Simulate PDF Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    // Simulate parsing delay
    setTimeout(() => {
      setContainerNumber('MSCU1234567');
      setAvailabilityDate('2026-03-01');
      setPickupDate('2026-03-10');
      setFreeTimeDays('4');
      setBilledDays('6');
      setDailyRate('150');
      setTotalBilled('900');
      setLoading(false);
    }, 1500);
  };

  const handleAudit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!containerNumber || !availabilityDate || !pickupDate || !freeTimeDays || !billedDays || !dailyRate || !totalBilled) return;

    const auditResult = auditInvoice(
      containerNumber,
      availabilityDate,
      pickupDate,
      parseInt(freeTimeDays),
      parseInt(billedDays),
      parseFloat(dailyRate),
      parseFloat(totalBilled)
    );

    setResult(auditResult);
  };

  const handleSaveAudit = async () => {
    if (!user) {
      if (window.confirm('You need to be signed in to save audits and generate disputes. Sign in now?')) {
        signInWithGoogle();
      }
      return;
    }

    if (!result) return;

    setSaving(true);
    try {
      await addDoc(collection(db, 'dnd_audits'), {
        userId: user.uid,
        containerNumber: result.containerNumber,
        availabilityDate: result.availabilityDate,
        pickupDate: result.pickupDate,
        freeTimeDays: result.freeTimeDays,
        billedDays: result.billedDays,
        dailyRate: result.dailyRate,
        totalBilled: result.totalBilled,
        isValid: result.isValid,
        estimatedOvercharge: result.estimatedOvercharge,
        issues: result.issues,
        createdAt: new Date().toISOString()
      });

      alert('Audit saved to history!');
      navigate('/dnd-dashboard');
    } catch (error) {
      console.error('Error saving audit', error);
      alert('Failed to save audit.');
    } finally {
      setSaving(false);
    }
  };

  const generateDisputeEmail = () => {
    if (!user) {
      if (window.confirm('You need to be signed in to generate dispute letters. Sign in now?')) {
        signInWithGoogle();
      }
      return;
    }

    if (!result) return;

    const subject = `Dispute of Demurrage Charges - Container ${result.containerNumber}`;
    const body = `To Whom It May Concern,

I am writing to formally dispute the demurrage charges invoiced for container ${result.containerNumber}.

Based on our review of the invoice and terminal records, we have identified the following issues:
${result.issues.map(issue => `- ${issue}`).join('\n')}

We estimate an overcharge of $${result.estimatedOvercharge.toFixed(2)}.

Please review this invoice and issue a revised statement reflecting the correct charges.

Thank you,
${user.email}`;

    // Open email client
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full">
      <div className="text-center mb-10 max-w-3xl mx-auto px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-700 text-sm font-medium mb-6">
          <FileWarning className="w-4 h-4" />
          D&D Auditor
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-zinc-900 tracking-tight mb-4">
          Check Before You <span className="text-red-600">Pay</span>
        </h1>
        <p className="text-lg text-zinc-600">
          Find overcharges in your detention & demurrage invoices instantly.
        </p>
      </div>

      <div className="w-full max-w-5xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Form */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* File Upload Area */}
          <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6 md:p-8 text-center border-dashed">
            <input 
              type="file" 
              accept=".pdf,.jpg,.png" 
              className="hidden" 
              id="invoice-upload"
              onChange={handleFileUpload}
            />
            <label 
              htmlFor="invoice-upload"
              className="cursor-pointer flex flex-col items-center justify-center"
            >
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
              </div>
              <h3 className="text-sm font-medium text-zinc-900 mb-1">Upload Invoice (PDF)</h3>
              <p className="text-xs text-zinc-500">We'll extract the data automatically.</p>
            </label>
          </div>

          <div className="flex items-center gap-4">
            <div className="h-px bg-zinc-200 flex-1"></div>
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">OR ENTER MANUALLY</span>
            <div className="h-px bg-zinc-200 flex-1"></div>
          </div>

          <form onSubmit={handleAudit} className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6 md:p-8 space-y-5">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Container Number</label>
              <input
                type="text"
                required
                value={containerNumber}
                onChange={(e) => setContainerNumber(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all uppercase"
                placeholder="e.g. MSCU1234567"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Availability Date</label>
                <input
                  type="date"
                  required
                  value={availabilityDate}
                  onChange={(e) => setAvailabilityDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Pickup Date</label>
                <input
                  type="date"
                  required
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Free Time (Days)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={freeTimeDays}
                  onChange={(e) => setFreeTimeDays(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Billed Days</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={billedDays}
                  onChange={(e) => setBilledDays(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Daily Rate ($)</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={dailyRate}
                  onChange={(e) => setDailyRate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Total Billed ($)</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={totalBilled}
                  onChange={(e) => setTotalBilled(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !containerNumber}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 shadow-sm mt-4"
            >
              Audit Invoice
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {!result ? (
            <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 h-full flex flex-col items-center justify-center p-12 text-center text-zinc-500">
              <FileText className="w-16 h-16 text-zinc-200 mb-4" />
              <h3 className="text-lg font-medium text-zinc-900 mb-2">Ready to Audit</h3>
              <p>Upload an invoice or enter details manually to detect billing errors and overcharges.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Status Header */}
              <div className={cn(
                "px-6 py-5 border-b flex items-center justify-between",
                result.isValid ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"
              )}>
                <div className="flex items-center gap-3">
                  {result.isValid ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  )}
                  <div>
                    <h3 className={cn(
                      "text-sm font-bold uppercase tracking-wider",
                      result.isValid ? "text-emerald-700" : "text-red-700"
                    )}>
                      Invoice Status
                    </h3>
                    <p className={cn(
                      "text-xl font-extrabold",
                      result.isValid ? "text-emerald-900" : "text-red-900"
                    )}>
                      {result.isValid ? "VALID" : "INVALID ⚠️"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Container</p>
                  <p className="font-mono font-bold text-zinc-900">{result.containerNumber}</p>
                </div>
              </div>

              <div className="p-6">
                {/* Issues List */}
                {!result.isValid && (
                  <div className="mb-8">
                    <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-3">Identified Issues</h4>
                    <ul className="space-y-3">
                      {result.issues.map((issue, idx) => (
                        <li key={idx} className="flex items-start gap-3 p-3 bg-red-50/50 rounded-lg border border-red-100">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0"></div>
                          <span className="text-sm text-red-900 leading-relaxed">{issue}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Overcharge Estimate */}
                <div className="bg-zinc-900 rounded-xl p-6 flex items-center justify-between text-white mb-8">
                  <div>
                    <p className="text-zinc-400 text-sm mb-1">Estimated Overcharge</p>
                    <p className="text-4xl font-bold text-red-400">${result.estimatedOvercharge.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-zinc-400 text-sm mb-1">Total Billed</p>
                    <p className="text-xl font-semibold text-zinc-300">
                      ${result.totalBilled.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Data Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Free Time</p>
                    <p className="font-medium text-zinc-900">{result.freeTimeDays} Days</p>
                  </div>
                  <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Billed Days</p>
                    <p className="font-medium text-zinc-900">{result.billedDays} Days</p>
                  </div>
                  <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Daily Rate</p>
                    <p className="font-medium text-zinc-900">${result.dailyRate}</p>
                  </div>
                  <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Dates</p>
                    <p className="font-medium text-zinc-900 text-xs">{result.availabilityDate} to {result.pickupDate}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={generateDisputeEmail}
                    disabled={result.isValid}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                  >
                    <Mail className="w-4 h-4" />
                    Generate Dispute Letter
                  </button>
                  
                  <button 
                    onClick={handleSaveAudit}
                    disabled={saving}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-900 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Save & Export Report
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
