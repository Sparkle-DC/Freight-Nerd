import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import { DollarSign, Package, History, Trash2, Plus, Download, Globe } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../components/LtlCalculator';

export const LandedCostDashboard: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [savedProducts, setSavedProducts] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      if (!loading) navigate('/landed-cost');
      return;
    }

    const qProducts = query(collection(db, 'saved_products'), where('userId', '==', user.uid));
    const unsubscribeProducts = onSnapshot(qProducts, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setSavedProducts(data);
    });

    const qHistory = query(collection(db, 'landed_cost_history'), where('userId', '==', user.uid));
    const unsubscribeHistory = onSnapshot(qHistory, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setHistory(data);
    });

    return () => {
      unsubscribeProducts();
      unsubscribeHistory();
    };
  }, [user, loading, navigate]);

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product from your catalog?')) return;
    try {
      await deleteDoc(doc(db, 'saved_products', id));
    } catch (error) {
      console.error('Error deleting product', error);
      alert('Failed to delete product.');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;
  if (!user) return null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Landed Cost Estimator</h1>
        <Link 
          to="/landed-cost" 
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Estimate
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Package className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Product Catalog</h3>
          </div>
          <p className="text-3xl font-bold text-zinc-900">{savedProducts.length}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <History className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Total Estimates</h3>
          </div>
          <p className="text-3xl font-bold text-zinc-900">{history.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Saved Products */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col h-[600px]">
          <div className="px-6 py-5 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900">Saved Product Catalog</h2>
            <button 
              onClick={() => alert('Bulk upload feature coming soon! (Mock)')}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              Bulk Upload CSV
            </button>
          </div>
          
          {savedProducts.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 flex-1 flex flex-col items-center justify-center">
              <Package className="w-12 h-12 text-zinc-200 mb-4" />
              <p className="mb-4">No products saved yet.</p>
              <Link to="/landed-cost" className="text-indigo-600 hover:text-indigo-700 font-medium">Estimate your first product</Link>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 overflow-y-auto flex-1">
              {savedProducts.map(product => (
                <div key={product.id} className="p-6 hover:bg-zinc-50 transition-colors group relative">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-zinc-900">{product.name}</h3>
                      <p className="text-xs text-zinc-500 mt-1">{product.description}</p>
                    </div>
                    <button 
                      onClick={() => handleDeleteProduct(product.id)}
                      className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                      title="Delete Product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4 text-sm bg-zinc-100 p-3 rounded-lg">
                    <div>
                      <span className="text-zinc-500 block text-xs uppercase tracking-wider mb-1">HS Code</span>
                      <span className="font-mono font-medium text-zinc-900">{product.hsCode}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-xs uppercase tracking-wider mb-1">Route</span>
                      <span className="font-medium text-zinc-900 flex items-center gap-1">
                        <Globe className="w-3 h-3" /> {product.originCountry} → {product.destinationCountry}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-xs uppercase tracking-wider mb-1">Duty Rate</span>
                      <span className="font-medium text-red-600">{product.dutyRate}%</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-xs uppercase tracking-wider mb-1">VAT Rate</span>
                      <span className="font-medium text-red-600">{product.vatRate}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* History */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col h-[600px]">
          <div className="px-6 py-5 border-b border-zinc-200 bg-zinc-50">
            <h2 className="text-lg font-semibold text-zinc-900">Recent Estimates</h2>
          </div>
          
          {history.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 flex-1 flex flex-col items-center justify-center">
              <History className="w-12 h-12 text-zinc-200 mb-4" />
              <p>No estimate history.</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 overflow-y-auto flex-1">
              {history.map(item => (
                <div key={item.id} className="p-6 hover:bg-zinc-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-zinc-900">{item.productDescription}</span>
                    </div>
                    <div className="text-xs text-zinc-500">
                      {format(new Date(item.createdAt), 'MMM d, yyyy')}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-zinc-500 mb-3">
                    <span className="font-mono bg-zinc-100 px-2 py-0.5 rounded">HS: {item.hsCode}</span>
                    <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {item.originCountry} → {item.destinationCountry}</span>
                  </div>

                  <div className="flex items-center justify-between bg-zinc-900 text-white p-3 rounded-xl">
                    <div>
                      <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-0.5">Product Value</p>
                      <p className="font-medium">${item.productValue.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-0.5">Total Landed Cost</p>
                      <p className="font-bold text-lg">${item.landedCost.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
