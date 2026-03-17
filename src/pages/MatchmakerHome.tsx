import React, { useState } from 'react';
import { Network, ArrowRight, CheckCircle2, Loader2, Mail, Building2, MapPin, Package, Globe } from 'lucide-react';
import { cn } from '../components/LtlCalculator';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { matchProviders, MatchRequirements, Provider } from '../services/matchmakerService';

type Step = 'intake' | 'analyzing' | 'email_gate' | 'results';

export const MatchmakerHome: React.FC = () => {
  const { user } = useAuth();
  
  const [step, setStep] = useState<Step>('intake');
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [volume, setVolume] = useState('1000');
  const [productType, setProductType] = useState('');
  const [avgWeight, setAvgWeight] = useState('1-5lbs');
  const [regions, setRegions] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [specialNeeds, setSpecialNeeds] = useState<string[]>([]);
  
  // Gate State
  const [email, setEmail] = useState(user?.email || '');
  
  // Results State
  const [matches, setMatches] = useState<{ provider: Provider, score: number }[]>([]);
  const [quotesRequested, setQuotesRequested] = useState(false);

  const toggleArrayItem = (array: string[], setArray: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    if (array.includes(item)) {
      setArray(array.filter(i => i !== item));
    } else {
      setArray([...array, item]);
    }
  };

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!volume || !productType || regions.length === 0 || platforms.length === 0) {
      alert('Please fill out all required fields to get accurate matches.');
      return;
    }

    setStep('analyzing');
    
    // Simulate analysis delay
    setTimeout(() => {
      const reqs: MatchRequirements = {
        volume: parseInt(volume),
        productType,
        avgWeight,
        regions,
        platforms,
        specialNeeds
      };
      
      const foundMatches = matchProviders(reqs);
      setMatches(foundMatches);
      
      setStep('email_gate');
    }, 2000);
  };

  const [leadId, setLeadId] = useState<string | null>(null);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      // Save lead to Firestore
      const docRef = await addDoc(collection(db, '3pl_leads'), {
        userId: user ? user.uid : 'anonymous',
        email,
        requirements: {
          volume: parseInt(volume),
          productType,
          avgWeight,
          regions,
          platforms,
          specialNeeds
        },
        matchedProviders: matches.map(m => m.provider.id),
        status: 'new',
        createdAt: new Date().toISOString()
      });

      setLeadId(docRef.id);
      setStep('results');
    } catch (error) {
      console.error('Error saving lead', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestQuotes = async () => {
    setQuotesRequested(true);
    alert('Your requirements have been sent to the matched providers. They will contact you shortly with quotes.');
    
    if (leadId && user) {
      try {
        await updateDoc(doc(db, '3pl_leads', leadId), {
          status: 'quotes_requested'
        });
      } catch (error) {
        console.error('Error updating lead status', error);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full">
      
      {/* Header */}
      <div className="text-center mb-10 max-w-3xl mx-auto px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-sm font-medium mb-6">
          <Network className="w-4 h-4" />
          3PL Matchmaker
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-zinc-900 tracking-tight mb-4">
          Find the right logistics partner in <span className="text-indigo-600">60 seconds</span>
        </h1>
        <p className="text-lg text-zinc-600">
          Stop Googling for 3PLs. Tell us what you need, and our engine will match you with vetted fulfillment centers that fit your exact profile.
        </p>
      </div>

      <div className="w-full max-w-3xl mx-auto px-4">
        
        {/* STEP 1: INTAKE FORM */}
        {step === 'intake' && (
          <form onSubmit={handleAnalyze} className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Monthly Order Volume *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={volume}
                  onChange={(e) => setVolume(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="e.g. 1000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Product Type *</label>
                <input
                  type="text"
                  required
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="e.g. Apparel, Electronics, Supplements"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-3">Average Shipment Weight *</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {['< 1 lb', '1-5 lbs', '5-20 lbs', '20+ lbs'].map(weight => (
                  <button
                    key={weight}
                    type="button"
                    onClick={() => setAvgWeight(weight)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium border transition-colors",
                      avgWeight === weight 
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700" 
                        : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                    )}
                  >
                    {weight}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-3">Target Regions *</label>
              <div className="flex flex-wrap gap-3">
                {['US', 'EU', 'Asia', 'Global'].map(region => (
                  <button
                    key={region}
                    type="button"
                    onClick={() => toggleArrayItem(regions, setRegions, region)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium border transition-colors flex items-center gap-2",
                      regions.includes(region)
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700" 
                        : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                    )}
                  >
                    <Globe className="w-4 h-4" />
                    {region}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-3">E-commerce Platforms *</label>
              <div className="flex flex-wrap gap-3">
                {['Shopify', 'Amazon', 'WooCommerce', 'BigCommerce', 'Magento', 'Custom/ERP'].map(platform => (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => toggleArrayItem(platforms, setPlatforms, platform)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium border transition-colors",
                      platforms.includes(platform)
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700" 
                        : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                    )}
                  >
                    {platform}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-3">Special Requirements (Optional)</label>
              <div className="flex flex-wrap gap-3">
                {['Cold Storage', 'Hazmat', 'Fragile', 'High Value', 'Kitting', 'Subscription Boxes', 'B2B'].map(need => (
                  <button
                    key={need}
                    type="button"
                    onClick={() => toggleArrayItem(specialNeeds, setSpecialNeeds, need)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium border transition-colors",
                      specialNeeds.includes(need)
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700" 
                        : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                    )}
                  >
                    {need}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-4 bg-zinc-900 hover:bg-zinc-800 text-white text-base font-medium rounded-xl transition-colors shadow-sm mt-4"
            >
              Find My Matches
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        )}

        {/* STEP 2: ANALYZING */}
        {step === 'analyzing' && (
          <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-12 text-center flex flex-col items-center justify-center animate-in fade-in duration-500">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-6" />
            <h3 className="text-xl font-bold text-zinc-900 mb-2">Analyzing your requirements...</h3>
            <p className="text-zinc-500">Scanning our network of vetted 3PL providers to find the perfect fit for your volume and product type.</p>
          </div>
        )}

        {/* STEP 3: EMAIL GATE */}
        {step === 'email_gate' && (
          <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-8 md:p-12 text-center animate-in zoom-in-95 duration-500">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-zinc-900 mb-2">We found {matches.length} great matches!</h3>
            <p className="text-zinc-600 mb-8 max-w-md mx-auto">
              Enter your email to view your matched 3PL providers and request quotes directly.
            </p>

            <form onSubmit={handleEmailSubmit} className="max-w-sm mx-auto space-y-4">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="work@email.com"
                className="w-full px-4 py-3 bg-white border border-zinc-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-center text-lg"
              />
              <button
                type="submit"
                disabled={loading || !email}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-base font-medium rounded-xl transition-colors disabled:opacity-50 shadow-sm"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
                View My Matches
              </button>
              <p className="text-xs text-zinc-400 mt-4">
                By continuing, you agree to share your requirements with matched providers.
              </p>
            </form>
          </div>
        )}

        {/* STEP 4: RESULTS */}
        {step === 'results' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <p className="text-emerald-800 font-medium">Successfully matched with {matches.length} providers</p>
              </div>
              {!quotesRequested && (
                <button 
                  onClick={handleRequestQuotes}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                >
                  Request Quotes from All
                </button>
              )}
              {quotesRequested && (
                <span className="text-sm font-bold text-emerald-700 uppercase tracking-wider">Quotes Requested ✓</span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6">
              {matches.map((match, idx) => (
                <div key={match.provider.id} className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6 relative overflow-hidden">
                  {idx === 0 && (
                    <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                      Top Match
                    </div>
                  )}
                  
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center text-zinc-500">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-zinc-900">{match.provider.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-zinc-500">
                            <MapPin className="w-3.5 h-3.5" />
                            {match.provider.locations.join(', ')}
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-zinc-600 text-sm mb-4 mt-4">{match.provider.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Integrations</p>
                          <p className="font-medium text-zinc-900">{match.provider.integrations.join(', ')}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Specialties</p>
                          <p className="font-medium text-zinc-900">{match.provider.specialties.join(', ')}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="md:w-48 flex flex-col justify-center gap-3 border-t md:border-t-0 md:border-l border-zinc-100 pt-4 md:pt-0 md:pl-6">
                      <div className="text-center md:text-left mb-2">
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Match Score</p>
                        <div className="flex items-end justify-center md:justify-start gap-1">
                          <span className="text-3xl font-extrabold text-indigo-600">{match.score}</span>
                          <span className="text-sm text-zinc-500 mb-1">/100</span>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => {
                          alert(`Requesting quote from ${match.provider.name}...`);
                          setQuotesRequested(true);
                        }}
                        disabled={quotesRequested}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                      >
                        {quotesRequested ? 'Quote Requested' : 'Get Quote'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
