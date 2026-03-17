import React, { useState } from 'react';
import { LtlCalculator, LtlData } from '../components/LtlCalculator';
import { useAuth } from '../AuthContext';
import { signInWithGoogle, db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { X, ShieldCheck } from 'lucide-react';

export const LtlHome: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ltlDataToSave, setLtlDataToSave] = useState<LtlData | null>(null);
  const [skuName, setSkuName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSaveClick = async (data: LtlData) => {
    if (!user) {
      if (window.confirm('You need to be signed in to save SKU profiles. Sign in now?')) {
        signInWithGoogle();
      }
      return;
    }
    
    // Save to history automatically
    try {
      await addDoc(collection(db, 'shipment_history'), {
        userId: user.uid,
        length: data.length,
        width: data.width,
        height: data.height,
        weight: data.weight,
        units: data.units,
        palletIncluded: data.palletIncluded,
        stackable: data.stackable,
        packagingType: data.packagingType,
        density: data.density,
        estimatedClass: data.estimatedClass,
        riskScore: data.riskScore,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error saving history', error);
    }

    setLtlDataToSave(data);
    setIsModalOpen(true);
  };

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !ltlDataToSave) return;
    
    setSaving(true);
    try {
      await addDoc(collection(db, 'sku_profiles'), {
        userId: user.uid,
        sku: skuName,
        length: ltlDataToSave.length,
        width: ltlDataToSave.width,
        height: ltlDataToSave.height,
        weight: ltlDataToSave.weight,
        palletIncluded: ltlDataToSave.palletIncluded,
        stackable: ltlDataToSave.stackable,
        packagingType: ltlDataToSave.packagingType,
        createdAt: new Date().toISOString()
      });

      setIsModalOpen(false);
      navigate('/ltl-dashboard');
    } catch (error) {
      console.error('Error saving SKU', error);
      alert('Failed to save SKU profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full">
      <div className="text-center mb-12 max-w-3xl mx-auto px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-sm font-medium mb-6">
          <ShieldCheck className="w-4 h-4" />
          Pre-BOL Validation Layer
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-zinc-900 tracking-tight mb-4">
          Avoid Costly <span className="text-indigo-600">Reclassifications</span>
        </h1>
        <p className="text-lg text-zinc-600">
          Calculate density, estimate class, and detect carrier audit risks before you book freight. Save SKUs for instant reuse.
        </p>
      </div>

      <LtlCalculator onSave={handleSaveClick} />

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-zinc-100">
              <h3 className="text-lg font-semibold text-zinc-900">Save SKU Profile</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">SKU or Product Name</label>
                <input
                  type="text"
                  required
                  value={skuName}
                  onChange={(e) => setSkuName(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="e.g. Engine Parts Box"
                />
              </div>

              <div className="bg-zinc-50 p-4 rounded-lg text-sm text-zinc-600 space-y-1">
                <p>Dims: {ltlDataToSave?.length}x{ltlDataToSave?.width}x{ltlDataToSave?.height} in</p>
                <p>Weight: {ltlDataToSave?.weight} lbs</p>
                <p>Handling: {ltlDataToSave?.packagingType}</p>
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
                  {saving ? 'Saving...' : 'Save SKU'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
