import React, { useState, useEffect } from 'react';
import { Box, Save, Copy, Download, AlertTriangle, CheckCircle2, Info, ArrowRightLeft } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface LtlData {
  length: number;
  width: number;
  height: number;
  weight: number;
  units: number;
  palletIncluded: boolean;
  stackable: boolean;
  packagingType: string;
  density: number;
  estimatedClass: string;
  riskScore: 'LOW' | 'MEDIUM' | 'HIGH';
  riskFlags: string[];
  cbm: number;
  unitSystem: 'imperial' | 'metric';
}

interface LtlCalculatorProps {
  onSave?: (data: LtlData) => void;
  initialData?: Partial<LtlData>;
  isSavedView?: boolean;
}

const PACKAGING_TYPES = ['Pallet', 'Carton/Box', 'Crate', 'Drum/Barrel', 'Irregular/Other'];

export const LtlCalculator: React.FC<LtlCalculatorProps> = ({ onSave, initialData, isSavedView = false }) => {
  const [unitSystem, setUnitSystem] = useState<'imperial' | 'metric'>(initialData?.unitSystem || 'imperial');
  
  const [length, setLength] = useState<string>(initialData?.length?.toString() || '48');
  const [width, setWidth] = useState<string>(initialData?.width?.toString() || '40');
  const [height, setHeight] = useState<string>(initialData?.height?.toString() || '48');
  const [weight, setWeight] = useState<string>(initialData?.weight?.toString() || '500');
  const [units, setUnits] = useState<string>(initialData?.units?.toString() || '1');
  
  const [palletIncluded, setPalletIncluded] = useState<boolean>(initialData?.palletIncluded ?? true);
  const [palletType, setPalletType] = useState<'none' | 'standard' | 'custom'>('none');
  const [palletLength, setPalletLength] = useState<string>('48');
  const [palletWidth, setPalletWidth] = useState<string>('40');
  const [palletHeight, setPalletHeight] = useState<string>('6');
  const [palletWeight, setPalletWeight] = useState<string>('45');
  
  const [stackable, setStackable] = useState<boolean>(initialData?.stackable ?? false);
  const [packagingType, setPackagingType] = useState<string>(initialData?.packagingType || 'Pallet');

  const [result, setResult] = useState<LtlData | null>(null);

  // Initialize palletType based on palletIncluded
  useEffect(() => {
    if (initialData && initialData.palletIncluded === false) {
      setPalletType('none');
    } else if (initialData && initialData.palletIncluded === true) {
      setPalletType('standard');
    }
  }, [initialData]);

  const toggleUnitSystem = () => {
    if (unitSystem === 'imperial') {
      // Convert to metric
      setLength((parseFloat(length) * 2.54).toFixed(1));
      setWidth((parseFloat(width) * 2.54).toFixed(1));
      setHeight((parseFloat(height) * 2.54).toFixed(1));
      setWeight((parseFloat(weight) / 2.20462).toFixed(1));
      
      setPalletLength((parseFloat(palletLength) * 2.54).toFixed(1));
      setPalletWidth((parseFloat(palletWidth) * 2.54).toFixed(1));
      setPalletHeight((parseFloat(palletHeight) * 2.54).toFixed(1));
      setPalletWeight((parseFloat(palletWeight) / 2.20462).toFixed(1));
      
      setUnitSystem('metric');
    } else {
      // Convert to imperial
      setLength((parseFloat(length) / 2.54).toFixed(1));
      setWidth((parseFloat(width) / 2.54).toFixed(1));
      setHeight((parseFloat(height) / 2.54).toFixed(1));
      setWeight((parseFloat(weight) * 2.20462).toFixed(1));
      
      setPalletLength((parseFloat(palletLength) / 2.54).toFixed(1));
      setPalletWidth((parseFloat(palletWidth) / 2.54).toFixed(1));
      setPalletHeight((parseFloat(palletHeight) / 2.54).toFixed(1));
      setPalletWeight((parseFloat(palletWeight) * 2.20462).toFixed(1));
      
      setUnitSystem('imperial');
    }
  };

  useEffect(() => {
    const l = parseFloat(length);
    const w = parseFloat(width);
    const h = parseFloat(height);
    const wt = parseFloat(weight);
    const u = parseInt(units, 10);

    if (!isNaN(l) && !isNaN(w) && !isNaN(h) && !isNaN(wt) && !isNaN(u) && l > 0 && w > 0 && h > 0 && wt > 0 && u > 0) {
      
      // Calculate final dimensions including pallet if applicable
      let finalL = l;
      let finalW = w;
      let finalH = h;
      let finalWt = wt;
      
      if (palletType !== 'none') {
        const pL = parseFloat(palletLength) || 0;
        const pW = parseFloat(palletWidth) || 0;
        const pH = parseFloat(palletHeight) || 0;
        const pWt = parseFloat(palletWeight) || 0;
        
        // Pallet dimensions typically override if larger, and height is added
        finalL = Math.max(l, pL);
        finalW = Math.max(w, pW);
        finalH = h + pH;
        finalWt = wt + pWt;
      }

      // Convert to Imperial for NMFC Density Calculation
      const l_in = unitSystem === 'metric' ? finalL / 2.54 : finalL;
      const w_in = unitSystem === 'metric' ? finalW / 2.54 : finalW;
      const h_in = unitSystem === 'metric' ? finalH / 2.54 : finalH;
      const wt_lbs = unitSystem === 'metric' ? finalWt * 2.20462 : finalWt;

      // Calculate total cubic inches
      const totalCubicInches = l_in * w_in * h_in * u;
      // Convert to cubic feet
      const totalCubicFeet = totalCubicInches / 1728;
      // Calculate density (PCF)
      const density = wt_lbs / totalCubicFeet;
      
      // Calculate CBM (Cubic Meters)
      const cbm = totalCubicFeet * 0.0283168;

      // Estimate Class (simplified NMFC mapping)
      let estimatedClass = '50';
      if (density < 1) estimatedClass = '400';
      else if (density < 2) estimatedClass = '300';
      else if (density < 4) estimatedClass = '250';
      else if (density < 6) estimatedClass = '150';
      else if (density < 8) estimatedClass = '125';
      else if (density < 10.5) estimatedClass = '100';
      else if (density < 12) estimatedClass = '92.5';
      else if (density < 15) estimatedClass = '85';
      else if (density < 22.5) estimatedClass = '70';
      else if (density < 30) estimatedClass = '65';
      else if (density < 35) estimatedClass = '60';
      else if (density < 50) estimatedClass = '55';

      // Risk Engine
      const riskFlags: string[] = [];
      let riskScore: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';

      if (palletType === 'none' && (packagingType === 'Pallet' || wt_lbs > 150)) {
        riskFlags.push('Pallet dimensions/weight not included. High risk of reweigh/remeasure.');
        riskScore = 'HIGH';
      }
      if (!stackable) {
        riskFlags.push('Non-stackable freight often incurs capacity surcharges or higher class.');
        if (riskScore !== 'HIGH') riskScore = 'MEDIUM';
      }
      if (packagingType === 'Irregular/Other') {
        riskFlags.push('Irregular shape. Carrier will measure at extreme points (highest/widest).');
        riskScore = 'HIGH';
      }
      if (density < 6) {
        riskFlags.push('Low density band. Very sensitive to small dimension errors.');
        if (riskScore !== 'HIGH') riskScore = 'MEDIUM';
      }
      if (l_in % 10 === 0 && w_in % 10 === 0 && h_in % 10 === 0) {
        riskFlags.push('Perfectly rounded dimensions (e.g. 40x40x40) trigger automated audit flags.');
        if (riskScore !== 'HIGH') riskScore = 'MEDIUM';
      }

      setResult({
        length: finalL,
        width: finalW,
        height: finalH,
        weight: finalWt,
        units: u,
        palletIncluded: palletType !== 'none',
        stackable,
        packagingType,
        density,
        estimatedClass,
        riskScore,
        riskFlags,
        cbm,
        unitSystem
      });
    } else {
      setResult(null);
    }
  }, [length, width, height, weight, units, palletType, palletLength, palletWidth, palletHeight, palletWeight, stackable, packagingType, unitSystem]);

  const handleCopy = () => {
    if (!result) return;
    const uLen = result.unitSystem === 'metric' ? 'cm' : 'in';
    const uWt = result.unitSystem === 'metric' ? 'kg' : 'lbs';
    
    const text = `Shipment Summary
Dimensions: ${result.length.toFixed(1)} x ${result.width.toFixed(1)} x ${result.height.toFixed(1)} ${uLen}
Weight: ${result.weight.toFixed(1)} ${uWt}
Units: ${result.units}
Volume: ${result.cbm.toFixed(3)} CBM
Density: ${result.density.toFixed(2)} PCF
Estimated Class: ${result.estimatedClass}
Handling: ${result.packagingType}, ${result.stackable ? 'Stackable' : 'Non-Stackable'}, ${result.palletIncluded ? 'Pallet Included' : 'Pallet Not Included'}

Notes:
${result.riskFlags.map(f => '- ' + f).join('\n')}`;
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const uLen = unitSystem === 'metric' ? 'cm' : 'in';
  const uWt = unitSystem === 'metric' ? 'kg' : 'lbs';

  return (
    <div className="w-full max-w-5xl mx-auto bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col lg:flex-row">
      {/* Inputs Section */}
      <div className="p-6 md:p-8 lg:w-5/12 bg-zinc-50 border-b lg:border-b-0 lg:border-r border-zinc-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Box className="w-5 h-5 text-zinc-700" />
            <h2 className="text-lg font-semibold text-zinc-900">Shipment Details</h2>
          </div>
          
          <button 
            onClick={toggleUnitSystem}
            disabled={isSavedView}
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 bg-white border border-zinc-200 rounded-md hover:bg-zinc-50 text-zinc-600 transition-colors disabled:opacity-50"
          >
            <ArrowRightLeft className="w-3 h-3" />
            {unitSystem === 'imperial' ? 'Switch to Metric' : 'Switch to Imperial'}
          </button>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">L ({uLen})</label>
              <input
                type="number"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                disabled={isSavedView}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">W ({uLen})</label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                disabled={isSavedView}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">H ({uLen})</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                disabled={isSavedView}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Total Weight ({uWt})</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                disabled={isSavedView}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Units/Pieces</label>
              <input
                type="number"
                value={units}
                onChange={(e) => setUnits(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                disabled={isSavedView}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Packaging Type</label>
            <select
              value={packagingType}
              onChange={(e) => setPackagingType(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              disabled={isSavedView}
            >
              {PACKAGING_TYPES.map(pt => (
                <option key={pt} value={pt}>{pt}</option>
              ))}
            </select>
          </div>

          {/* Inline Pallet Calculator */}
          <div className="pt-2 border-t border-zinc-200">
            <label className="block text-sm font-medium text-zinc-700 mb-2">Add Pallet Dimensions</label>
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setPalletType('none')}
                className={cn("flex-1 py-1.5 text-xs font-medium rounded-md border transition-colors", palletType === 'none' ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50")}
                disabled={isSavedView}
              >
                None
              </button>
              <button
                type="button"
                onClick={() => {
                  setPalletType('standard');
                  setPalletLength(unitSystem === 'metric' ? '121.9' : '48');
                  setPalletWidth(unitSystem === 'metric' ? '101.6' : '40');
                  setPalletHeight(unitSystem === 'metric' ? '15.2' : '6');
                  setPalletWeight(unitSystem === 'metric' ? '20.4' : '45');
                }}
                className={cn("flex-1 py-1.5 text-xs font-medium rounded-md border transition-colors", palletType === 'standard' ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50")}
                disabled={isSavedView}
              >
                Standard
              </button>
              <button
                type="button"
                onClick={() => setPalletType('custom')}
                className={cn("flex-1 py-1.5 text-xs font-medium rounded-md border transition-colors", palletType === 'custom' ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50")}
                disabled={isSavedView}
              >
                Custom
              </button>
            </div>
            
            {palletType === 'custom' && (
              <div className="grid grid-cols-4 gap-2 mb-3 animate-in fade-in slide-in-from-top-2">
                <div>
                  <label className="block text-[10px] uppercase text-zinc-500 mb-1">L ({uLen})</label>
                  <input type="number" value={palletLength} onChange={e => setPalletLength(e.target.value)} className="w-full px-2 py-1.5 text-sm bg-white border border-zinc-300 rounded-md" disabled={isSavedView} />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-zinc-500 mb-1">W ({uLen})</label>
                  <input type="number" value={palletWidth} onChange={e => setPalletWidth(e.target.value)} className="w-full px-2 py-1.5 text-sm bg-white border border-zinc-300 rounded-md" disabled={isSavedView} />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-zinc-500 mb-1">H ({uLen})</label>
                  <input type="number" value={palletHeight} onChange={e => setPalletHeight(e.target.value)} className="w-full px-2 py-1.5 text-sm bg-white border border-zinc-300 rounded-md" disabled={isSavedView} />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-zinc-500 mb-1">Wt ({uWt})</label>
                  <input type="number" value={palletWeight} onChange={e => setPalletWeight(e.target.value)} className="w-full px-2 py-1.5 text-sm bg-white border border-zinc-300 rounded-md" disabled={isSavedView} />
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 pt-2 border-t border-zinc-200">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={stackable}
                onChange={(e) => setStackable(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-zinc-300 focus:ring-indigo-500"
                disabled={isSavedView}
              />
              <span className="text-sm text-zinc-700">Freight is stackable</span>
            </label>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="p-6 md:p-8 lg:w-7/12 bg-white flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-6">Validation Result</h3>
          
          {result ? (
            <div className="space-y-6" id="shipment-summary">
              <div className="flex flex-wrap items-end justify-between border-b border-zinc-100 pb-4 gap-4">
                <div>
                  <p className="text-sm text-zinc-500 mb-1">Calculated Density</p>
                  <p className="text-4xl font-bold text-zinc-900">{result.density.toFixed(2)}<span className="text-lg font-medium text-zinc-400"> PCF</span></p>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-sm text-zinc-500 mb-1">Estimated Class</p>
                  <p className="text-2xl font-semibold text-indigo-600">Class {result.estimatedClass}</p>
                </div>
              </div>

              {/* Risk Engine Output */}
              <div className={cn(
                "rounded-xl p-5 border",
                result.riskScore === 'HIGH' ? "bg-red-50 border-red-100" :
                result.riskScore === 'MEDIUM' ? "bg-amber-50 border-amber-100" :
                "bg-emerald-50 border-emerald-100"
              )}>
                <div className="flex items-center gap-2 mb-3">
                  {result.riskScore === 'HIGH' ? <AlertTriangle className="w-5 h-5 text-red-600" /> :
                   result.riskScore === 'MEDIUM' ? <AlertTriangle className="w-5 h-5 text-amber-600" /> :
                   <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                  <h4 className={cn(
                    "font-semibold",
                    result.riskScore === 'HIGH' ? "text-red-900" :
                    result.riskScore === 'MEDIUM' ? "text-amber-900" :
                    "text-emerald-900"
                  )}>
                    Reclassification Risk: {result.riskScore}
                  </h4>
                </div>
                
                {result.riskFlags.length > 0 ? (
                  <ul className="space-y-2">
                    {result.riskFlags.map((flag, idx) => (
                      <li key={idx} className={cn(
                        "text-sm flex items-start gap-2",
                        result.riskScore === 'HIGH' ? "text-red-800" : "text-amber-800"
                      )}>
                        <span className="mt-0.5">•</span>
                        <span>{flag}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-emerald-800">Shipment parameters look standard. Low risk of carrier reclassification.</p>
                )}
              </div>

              <div className="bg-zinc-50 rounded-lg p-4 text-sm text-zinc-600">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-zinc-900">Shipment Summary</p>
                  <p className="font-bold text-indigo-600">{result.cbm.toFixed(3)} CBM</p>
                </div>
                <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                  <div><span className="text-zinc-500">Final Dims:</span> {result.length.toFixed(1)}x{result.width.toFixed(1)}x{result.height.toFixed(1)} {uLen}</div>
                  <div><span className="text-zinc-500">Final Weight:</span> {result.weight.toFixed(1)} {uWt}</div>
                  <div><span className="text-zinc-500">Units:</span> {result.units}</div>
                  <div><span className="text-zinc-500">Handling:</span> {result.stackable ? 'Stackable' : 'Non-Stackable'}</div>
                  <div className="col-span-2"><span className="text-zinc-500">Packaging:</span> {result.packagingType} {result.palletIncluded ? '(w/ Pallet)' : ''}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-zinc-400 text-sm">
              Enter valid shipment dimensions to see validation
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
            Copy Summary
          </button>
          
          {onSave && !isSavedView && (
            <button 
              onClick={() => result && onSave(result)}
              disabled={!result}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <Save className="w-4 h-4" />
              Save SKU Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
