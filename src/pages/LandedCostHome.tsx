import React, { useState } from 'react';
import { Calculator, Globe, DollarSign, Package, Download, Save, AlertCircle, CheckCircle2, Loader2, ArrowRight, Leaf, ArrowRightLeft } from 'lucide-react';
import { suggestHsCode, calculateLandedCost, HsCodeSuggestion, LandedCostEstimate } from '../services/landedCostService';
import { cn } from '../components/LtlCalculator';
import { useAuth } from '../AuthContext';
import { signInWithGoogle, db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

// Simple inline carbon calculator
const calculateCarbon = (weightKg: number, mode: string, origin: string, dest: string) => {
  // Very rough estimates for MVP (kg CO2e per ton)
  // In a real app, this would use distance between origin/dest ports
  let multiplier = 0;
  if (mode === 'ocean') multiplier = 100; // ~10g per ton-km * 10,000 km
  if (mode === 'air') multiplier = 4000; // ~500g per ton-km * 8,000 km
  if (mode === 'truck') multiplier = 120; // ~60g per ton-km * 2,000 km
  if (mode === 'rail') multiplier = 40; // ~20g per ton-km * 2,000 km
  
  const tons = weightKg / 1000;
  return tons * multiplier;
};

export const LandedCostHome: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [shipping, setShipping] = useState('');
  const [origin, setOrigin] = useState('CN');
  const [destination, setDestination] = useState('US');
  
  // New inline utility states
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState<'lbs' | 'kg'>('lbs');
  const [transportMode, setTransportMode] = useState('ocean');
  const [carbonEstimate, setCarbonEstimate] = useState<number | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<HsCodeSuggestion[]>([]);
  const [selectedHs, setSelectedHs] = useState<HsCodeSuggestion | null>(null);
  const [estimate, setEstimate] = useState<LandedCostEstimate | null>(null);
  const [saving, setSaving] = useState(false);

  const toggleWeightUnit = () => {
    if (!weight) {
      setWeightUnit(weightUnit === 'lbs' ? 'kg' : 'lbs');
      return;
    }
    
    if (weightUnit === 'lbs') {
      setWeight((parseFloat(weight) / 2.20462).toFixed(1));
      setWeightUnit('kg');
    } else {
      setWeight((parseFloat(weight) * 2.20462).toFixed(1));
      setWeightUnit('lbs');
    }
  };

  const handleSuggest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !value) return;

    setLoading(true);
    setSuggestions([]);
    setSelectedHs(null);
    setEstimate(null);
    setCarbonEstimate(null);

    try {
      const results = await suggestHsCode(description, origin, destination);
      setSuggestions(results);
      if (results.length > 0) {
        handleSelectHs(results[0]);
      }
    } catch (error) {
      console.error('Error fetching HS codes', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHs = (hs: HsCodeSuggestion) => {
    setSelectedHs(hs);
    const val = parseFloat(value) || 0;
    const ship = parseFloat(shipping) || 0;
    
    const est = calculateLandedCost(val, ship, hs.dutyRate, hs.vatRate, hs.code);
    setEstimate(est);
    
    // Calculate carbon if weight is provided
    const wt = parseFloat(weight);
    if (!isNaN(wt) && wt > 0) {
      const weightKg = weightUnit === 'lbs' ? wt / 2.20462 : wt;
      setCarbonEstimate(calculateCarbon(weightKg, transportMode, origin, destination));
    } else {
      setCarbonEstimate(null);
    }
  };

  const handleSaveProduct = async () => {
    if (!user) {
      if (window.confirm('You need to be signed in to save products. Sign in now?')) {
        signInWithGoogle();
      }
      return;
    }

    if (!estimate || !selectedHs) return;

    setSaving(true);
    try {
      await addDoc(collection(db, 'saved_products'), {
        userId: user.uid,
        name: description.split(' ')[0] || 'Product',
        description: description,
        hsCode: estimate.hsCode,
        dutyRate: estimate.dutyRate,
        vatRate: estimate.vatRate,
        originCountry: origin,
        destinationCountry: destination,
        createdAt: new Date().toISOString()
      });

      // Also save to history
      await addDoc(collection(db, 'landed_cost_history'), {
        userId: user.uid,
        productDescription: description,
        originCountry: origin,
        destinationCountry: destination,
        productValue: estimate.productValue,
        shippingCost: estimate.shippingCost,
        hsCode: estimate.hsCode,
        dutyRate: estimate.dutyRate,
        vatRate: estimate.vatRate,
        totalDuty: estimate.totalDuty,
        totalVat: estimate.totalVat,
        landedCost: estimate.landedCost,
        createdAt: new Date().toISOString()
      });

      alert('Product saved to catalog!');
      navigate('/landed-cost-dashboard');
    } catch (error) {
      console.error('Error saving product', error);
      alert('Failed to save product.');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    if (!user) {
      if (window.confirm('You need to be signed in to export reports. Sign in now?')) {
        signInWithGoogle();
      }
      return;
    }
    alert('Landed Cost Report generated and downloaded! (Mock)');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full">
      <div className="text-center mb-10 max-w-3xl mx-auto px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-sm font-medium mb-6">
          <DollarSign className="w-4 h-4" />
          Landed Cost Estimator
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-zinc-900 tracking-tight mb-4">
          Know Your <span className="text-indigo-600">Total Import Cost</span>
        </h1>
        <p className="text-lg text-zinc-600">
          Avoid surprise duties and protect your margins before you ship.
        </p>
      </div>

      <div className="w-full max-w-5xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Form */}
        <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-zinc-200 p-6 md:p-8">
          <div className="flex items-center gap-2 mb-6">
            <Package className="w-5 h-5 text-zinc-700" />
            <h2 className="text-lg font-semibold text-zinc-900">Shipment Details</h2>
          </div>

          <form onSubmit={handleSuggest} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Product Description</label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="e.g. Wireless Bluetooth Headphones"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Product Value ($)</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="100.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Shipping Cost ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={shipping}
                  onChange={(e) => setShipping(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="20.00 (Optional)"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Origin</label>
                <select
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                >
                  <option value="CN">China (CN)</option>
                  <option value="MX">Mexico (MX)</option>
                  <option value="VN">Vietnam (VN)</option>
                  <option value="DE">Germany (DE)</option>
                  <option value="GB">United Kingdom (GB)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Destination</label>
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                >
                  <option value="US">United States (US)</option>
                  <option value="CA">Canada (CA)</option>
                  <option value="GB">United Kingdom (GB)</option>
                  <option value="AU">Australia (AU)</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-zinc-900">Carbon Estimate (Optional)</h3>
                <button 
                  type="button"
                  onClick={toggleWeightUnit}
                  className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded transition-colors"
                >
                  <ArrowRightLeft className="w-3 h-3" />
                  {weightUnit === 'lbs' ? 'Switch to kg' : 'Switch to lbs'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Total Weight ({weightUnit})</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="e.g. 500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Transport Mode</label>
                  <select
                    value={transportMode}
                    onChange={(e) => setTransportMode(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  >
                    <option value="ocean">Ocean Freight</option>
                    <option value="air">Air Freight</option>
                    <option value="truck">Truck</option>
                    <option value="rail">Rail</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !description.trim() || !value}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 shadow-sm mt-4"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Calculate Landed Cost'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {!estimate ? (
            <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 h-full flex flex-col items-center justify-center p-12 text-center text-zinc-500">
              <Calculator className="w-16 h-16 text-zinc-200 mb-4" />
              <h3 className="text-lg font-medium text-zinc-900 mb-2">Ready to Estimate</h3>
              <p>Enter your product details to see HS code suggestions and a full landed cost breakdown.</p>
            </div>
          ) : (
            <>
              {/* HS Code Suggestions */}
              <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50">
                  <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">HS Code Suggestions</h3>
                </div>
                <div className="p-4 space-y-3">
                  {suggestions.map((hs, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectHs(hs)}
                      className={cn(
                        "w-full text-left p-4 rounded-xl border transition-all flex items-start justify-between",
                        selectedHs?.code === hs.code 
                          ? "bg-indigo-50 border-indigo-200 ring-1 ring-indigo-500" 
                          : "bg-white border-zinc-200 hover:border-indigo-300 hover:bg-zinc-50"
                      )}
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono font-bold text-zinc-900">{hs.code}</span>
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                            hs.confidence === 'HIGH' ? "bg-emerald-100 text-emerald-700" :
                            hs.confidence === 'MEDIUM' ? "bg-amber-100 text-amber-700" :
                            "bg-zinc-100 text-zinc-700"
                          )}>
                            {hs.confidence} Match
                          </span>
                        </div>
                        <p className="text-sm text-zinc-600">{hs.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-zinc-900">Duty: {hs.dutyRate}%</p>
                        <p className="text-xs text-zinc-500">VAT: {hs.vatRate}%</p>
                      </div>
                    </button>
                  ))}
                  <div className="flex items-start gap-2 mt-4 p-3 bg-blue-50 text-blue-800 rounded-lg text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>
                      <strong>Disclaimer:</strong> These are suggested HS codes based on your description. You are responsible for verifying the final classification with a customs broker.
                    </p>
                  </div>
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50 flex justify-between items-center">
                  <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Landed Cost Breakdown</h3>
                  <div className="text-xs text-zinc-500 flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    {origin} → {destination}
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-zinc-600">Product Value</span>
                      <span className="font-medium text-zinc-900">${estimate.productValue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-zinc-600">Shipping Cost</span>
                      <span className="font-medium text-zinc-900">${estimate.shippingCost.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-zinc-100 pt-4 flex justify-between items-center text-sm">
                      <span className="text-zinc-600">Customs Value (CIF)</span>
                      <span className="font-medium text-zinc-900">${(estimate.productValue + estimate.shippingCost).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-zinc-600">Estimated Duty ({estimate.dutyRate}%)</span>
                      <span className="font-medium text-red-600">+ ${estimate.totalDuty.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-zinc-600">Estimated VAT ({estimate.vatRate}%)</span>
                      <span className="font-medium text-red-600">+ ${estimate.totalVat.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="bg-zinc-900 rounded-xl p-5 flex items-center justify-between text-white">
                    <div>
                      <p className="text-zinc-400 text-sm mb-1">Total Landed Cost</p>
                      <p className="text-3xl font-bold">${estimate.landedCost.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-zinc-400 text-sm mb-1">Effective Margin Impact</p>
                      <p className="text-xl font-semibold text-red-400">
                        +{((estimate.landedCost - estimate.productValue) / estimate.productValue * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {carbonEstimate !== null && (
                    <div className="mt-4 bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                          <Leaf className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-emerald-900">Estimated Carbon Footprint</p>
                          <p className="text-xs text-emerald-700">Based on {weight} {weightUnit} via {transportMode} freight</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-emerald-700">{carbonEstimate.toFixed(1)} kg</p>
                        <p className="text-[10px] font-medium text-emerald-600 uppercase tracking-wider">CO₂e</p>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
                    <span>Rates valid as of: <strong>Mar 2026</strong></span>
                    <span>Source: <strong>Global Tariff Database</strong></span>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-6 bg-zinc-50 border-t border-zinc-100 flex flex-wrap gap-3">
                  <button 
                    onClick={handleExport}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-900 text-sm font-medium rounded-lg transition-colors shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    Export Report
                  </button>
                  
                  <button 
                    onClick={handleSaveProduct}
                    disabled={saving}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save to Catalog'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
