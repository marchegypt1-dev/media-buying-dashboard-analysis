import React, { useState, useMemo } from 'react';
import { DailyEntry, Product, Settings } from '../../../shared/types';
import { ScaleIcon, CubeIcon } from '../../../shared/components/Icons';

interface ProductComparisonProps {
    entries: DailyEntry[];
    products: Product[];
    settings: Settings;
    formatCurrency: (value: number) => string;
}

interface ProductMetrics {
    unitsSold: number;
    totalRevenue: number;
    netProfit: number;
    profitMargin: number;
}

const ProductComparison: React.FC<ProductComparisonProps> = ({ entries, products, settings, formatCurrency }) => {
    const [productAId, setProductAId] = useState<string>('');
    const [productBId, setProductBId] = useState<string>('');

    const calculateMetrics = (productId: string): ProductMetrics | null => {
        if (!productId) return null;
        
        const product = products.find(p => p.id === productId);
        if (!product) return null;

        const productEntries = entries.filter(e => e.productId === productId);

        let unitsSold = 0;
        let totalRevenue = 0;
        let totalCost = 0;
        let totalAdSpend = 0;

        productEntries.forEach(entry => {
            const deliveryRate = (product.productDeliveryRate ?? settings.globalDeliveryRate) / 100;
            const effectiveUnitsSold = entry.totalUnitsSold * deliveryRate;
            
            unitsSold += entry.totalUnitsSold;
            totalRevenue += effectiveUnitsSold * product.sellingPricePerUnit;
            totalCost += effectiveUnitsSold * product.costPerUnit;
            totalAdSpend += entry.campaigns.reduce((sum, c) => sum + c.adSpend, 0) / settings.libyanDinarExchangeRate;
        });

        const netProfit = totalRevenue - totalCost - totalAdSpend;
        const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
        
        return { unitsSold, totalRevenue, netProfit, profitMargin };
    };
    
    const productAData = useMemo(() => calculateMetrics(productAId), [productAId, entries, products, settings]);
    const productBData = useMemo(() => calculateMetrics(productBId), [productBId, entries, products, settings]);
    
    const productAOptions = products;
    const productBOptions = products.filter(p => p.id !== productAId);
    
    const showComparison = productAData && productBData && productAId !== productBId;
    
    const selectClasses = "w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-gray-900 focus:ring-orange-500 focus:border-orange-500 transition-colors";

    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
            <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <ScaleIcon className="w-5 h-5 text-gray-500" />
                مقارنة بين المنتجات
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <select 
                    value={productAId} 
                    onChange={e => {
                        setProductAId(e.target.value);
                        // If the new product A is the same as product B, clear product B
                        if (e.target.value === productBId) {
                            setProductBId('');
                        }
                    }}
                    className={selectClasses}
                >
                    <option value="">-- اختر المنتج الأول --</option>
                    {productAOptions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select 
                    value={productBId} 
                    onChange={e => setProductBId(e.target.value)}
                    className={selectClasses}
                    disabled={!productAId}
                >
                    <option value="">-- اختر المنتج الثاني --</option>
                    {productBOptions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            </div>
            
            {showComparison ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-center">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 font-medium tracking-wider text-right">المقياس</th>
                                <th className="px-4 py-3 font-medium tracking-wider">{products.find(p => p.id === productAId)?.name}</th>
                                <th className="px-4 py-3 font-medium tracking-wider">{products.find(p => p.id === productBId)?.name}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 text-gray-700">
                            <tr className="hover:bg-gray-50">
                                <td className="px-4 py-4 font-semibold text-gray-900 text-right">القطع المباعة</td>
                                <td className="px-4 py-4 font-medium">{productAData.unitsSold.toLocaleString()}</td>
                                <td className="px-4 py-4 font-medium">{productBData.unitsSold.toLocaleString()}</td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                                <td className="px-4 py-4 font-semibold text-gray-900 text-right">إجمالي المبيعات</td>
                                <td className="px-4 py-4 font-medium">{formatCurrency(productAData.totalRevenue)}</td>
                                <td className="px-4 py-4 font-medium">{formatCurrency(productBData.totalRevenue)}</td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                                <td className="px-4 py-4 font-semibold text-gray-900 text-right">صافي الربح</td>
                                <td className={`px-4 py-4 font-bold ${productAData.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(productAData.netProfit)}</td>
                                <td className={`px-4 py-4 font-bold ${productBData.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(productBData.netProfit)}</td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                                <td className="px-4 py-4 font-semibold text-gray-900 text-right">هامش الربح</td>
                                <td className="px-4 py-4 font-medium">{productAData.profitMargin.toFixed(1)}%</td>
                                <td className="px-4 py-4 font-medium">{productBData.profitMargin.toFixed(1)}%</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-10 bg-gray-50 rounded-lg">
                    <CubeIcon className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">الرجاء اختيار منتجين لعرض المقارنة بينهما.</p>
                </div>
            )}
        </div>
    );
};

export default ProductComparison;