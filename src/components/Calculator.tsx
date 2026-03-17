import React, { useState, useEffect } from 'react';
import { Calculator as CalcIcon, Save, Copy, FileText, ArrowRight } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CalculatorProps {
  onSave?: (data: CalcData) => void;
  initialData?: Partial<CalcData>;
  isSavedView?: boolean;
}

export interface CalcData {
  baseRate: number;
  mpg: number;
  baselineFuelPrice: number;
  currentFuelPrice: number;
  surchargePerMile: number;
  surchargePercentage: number;
  adjustedRate: number;
}

export const Calculator: React.FC<CalculatorProps> = ({ onSave, initialData, isSavedView = false }) => {
  const [baseRate, setBaseRate] = useState<string>(initialData?.baseRate?.toString() || '2.00');
  const [mpg, setMpg] = useState<string>(initialData?.mpg?.toString() || '6.0');
  const [baselineFuelPrice, setBaselineFuelPrice] = useState<string>(initialData?.baselineFuelPrice?.toString() || '1.20');
  const [currentFuelPrice, setCurrentFuelPrice] = useState<string>(initialData?.currentFuelPrice?.toString() || '4.10');

  const [result, setResult] = useState<CalcData | null>(null);

  useEffect(() => {
    const br = parseFloat(baseRate);
    const m = parseFloat(mpg);
    const bfp = parseFloat(baselineFuelPrice);
    const cfp = parseFloat(currentFuelPrice);

    if (!isNaN(br) && !isNaN(m) && !isNaN(bfp) && !isNaN(cfp) && m > 0) {
      const difference = Math.max(0, cfp - bfp);
      const surchargePerMile = difference / m;
      const adjustedRate = br + surchargePerMile;
      const surchargePercentage = br > 0 ? (surchargePerMile / br) * 100 : 0;

      setResult({
        baseRate: br,
        mpg: m,
        baselineFuelPrice: bfp,
        currentFuelPrice: cfp,
        surchargePerMile,
        surchargePercentage,
        adjustedRate
      });
    } else {
      setResult(null);
    }
  }, [baseRate, mpg, baselineFuelPrice, currentFuelPrice]);

  const handleCopy = () => {
    if (!result) return;
    const text = `Fuel Surcharge Calculation
Base Rate: $${result.baseRate.toFixed(2)}/mi
Baseline Fuel: $${result.baselineFuelPrice.toFixed(2)}/gal
Current Fuel: $${result.currentFuelPrice.toFixed(2)}/gal
MPG: ${result.mpg.toFixed(1)}

Surcharge: ${result.surchargePercentage.toFixed(2)}% ($${result.surchargePerMile.toFixed(2)}/mi)
Adjusted Rate: $${result.adjustedRate.toFixed(2)}/mi`;
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col md:flex-row">
      {/* Inputs Section */}
      <div className="p-6 md:p-8 md:w-1/2 bg-zinc-50 border-b md:border-b-0 md:border-r border-zinc-200">
        <div className="flex items-center gap-2 mb-6">
          <CalcIcon className="w-5 h-5 text-zinc-700" />
          <h2 className="text-lg font-semibold text-zinc-900">Calculator</h2>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Base Rate ($/mile)</label>
            <input
              type="number"
              step="0.01"
              value={baseRate}
              onChange={(e) => setBaseRate(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="2.00"
              disabled={isSavedView}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Fuel Efficiency (MPG)</label>
            <input
              type="number"
              step="0.1"
              value={mpg}
              onChange={(e) => setMpg(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="6.0"
              disabled={isSavedView}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Baseline Fuel Price ($/gal)</label>
            <input
              type="number"
              step="0.01"
              value={baselineFuelPrice}
              onChange={(e) => setBaselineFuelPrice(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="1.20"
              disabled={isSavedView}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Current Fuel Price ($/gal)</label>
            <input
              type="number"
              step="0.01"
              value={currentFuelPrice}
              onChange={(e) => setCurrentFuelPrice(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="4.10"
              disabled={isSavedView}
            />
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="p-6 md:p-8 md:w-1/2 bg-white flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-6">Calculation Result</h3>
          
          {result ? (
            <div className="space-y-6">
              <div className="flex items-end justify-between border-b border-zinc-100 pb-4">
                <div>
                  <p className="text-sm text-zinc-500 mb-1">Adjusted Rate</p>
                  <p className="text-4xl font-bold text-zinc-900">${result.adjustedRate.toFixed(2)}<span className="text-lg font-medium text-zinc-400">/mi</span></p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-zinc-500 mb-1">Surcharge</p>
                  <p className="text-2xl font-semibold text-indigo-600">{result.surchargePercentage.toFixed(2)}%</p>
                </div>
              </div>

              <div className="bg-zinc-50 rounded-lg p-4 text-sm text-zinc-600 space-y-2">
                <p className="font-medium text-zinc-900 mb-2">Breakdown</p>
                <div className="flex justify-between">
                  <span>Price Difference:</span>
                  <span className="font-mono">${Math.max(0, result.currentFuelPrice - result.baselineFuelPrice).toFixed(2)}/gal</span>
                </div>
                <div className="flex justify-between">
                  <span>Divided by MPG ({result.mpg}):</span>
                  <span className="font-mono">${result.surchargePerMile.toFixed(2)}/mi</span>
                </div>
                <div className="flex justify-between font-medium text-zinc-900 pt-2 border-t border-zinc-200 mt-2">
                  <span>Total Surcharge:</span>
                  <span className="font-mono">+${result.surchargePerMile.toFixed(2)}/mi</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-zinc-400 text-sm">
              Enter valid numbers to see results
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-wrap gap-3">
          <button 
            onClick={handleCopy}
            disabled={!result}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Copy className="w-4 h-4" />
            Copy Text
          </button>
          
          {onSave && !isSavedView && (
            <button 
              onClick={() => result && onSave(result)}
              disabled={!result}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <Save className="w-4 h-4" />
              Save Schedule
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
