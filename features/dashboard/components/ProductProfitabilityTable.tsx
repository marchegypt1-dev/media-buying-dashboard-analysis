import React, { useMemo, useState } from 'react';
import { ProfitabilityData } from '../../../shared/types';
import { CubeIcon } from '../../../shared/components/Icons';

interface ProductProfitabilityTableProps {
    formatCurrency: (value: number) => string;
    data: ProfitabilityData[];
}

type SortKey = keyof ProfitabilityData;
type SortDirection = 'asc' | 'desc';

const SortableHeader: React.FC<{ 
    label: string; 
    sortKey: keyof ProfitabilityData; 
    currentSortKey: SortKey; 
    sortDirection: SortDirection; 
    onSort: (key: keyof ProfitabilityData) => void;
    className?: string;
}> = ({ label, sortKey, currentSortKey, sortDirection, onSort, className }) => {
    const isActive = currentSortKey === sortKey;
    const arrow = isActive ? (sortDirection === 'asc' ? '▲' : '▼') : '';
    return (
        <th className={`px-4 py-3 font-medium tracking-wider cursor-pointer select-none ${className}`} onClick={() => onSort(sortKey)}>
            {label} <span className="text-xs inline-block w-2">{arrow}</span>
        </th>
    );
};


const ProductProfitabilityTable: React.FC<ProductProfitabilityTableProps> = ({ formatCurrency, data }) => {
    const [sortKey, setSortKey] = useState<SortKey>('netProfit');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    const handleSort = (key: keyof ProfitabilityData) => {
        if (sortKey === key) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('desc');
        }
    };

    const sortedData = useMemo(() => {
        return [...data].sort((a, b) => {
            if (a[sortKey] < b[sortKey]) return sortDirection === 'asc' ? -1 : 1;
            if (a[sortKey] > b[sortKey]) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data, sortKey, sortDirection]);
    
    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
            <h2 className="text-base font-semibold text-gray-800 mb-4">تحليل ربحية المنتجات</h2>
             <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                        <tr>
                            <SortableHeader label="المنتج" sortKey="productName" currentSortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} />
                            <SortableHeader label="تكلفة القطعة" sortKey="costPerUnit" currentSortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} />
                            <SortableHeader label="القطع المباعة" sortKey="unitsSold" currentSortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} />
                            <SortableHeader label="إجمالي المبيعات" sortKey="totalRevenue" currentSortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} />
                            <SortableHeader label="صافي الربح" sortKey="netProfit" currentSortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} />
                            <SortableHeader label="هامش الربح" sortKey="profitMargin" currentSortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {sortedData.length > 0 ? sortedData.map(d => (
                            <tr key={d.productId} className="hover:bg-gray-50 transition-colors duration-200">
                                <td className="px-4 py-4 font-semibold text-gray-900">{d.productName}</td>
                                <td className="px-4 py-4 text-gray-700">{formatCurrency(d.costPerUnit)}</td>
                                <td className="px-4 py-4 text-gray-700">{d.unitsSold.toLocaleString()}</td>
                                <td className="px-4 py-4 text-gray-700">{formatCurrency(d.totalRevenue)}</td>
                                <td className={`px-4 py-4 font-bold ${d.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {formatCurrency(d.netProfit)}
                                </td>
                                <td className="px-4 py-4 text-gray-600">{d.profitMargin.toFixed(1)}%</td>
                            </tr>
                        )) : (
                             <tr>
                                <td colSpan={6} className="text-center py-16 text-gray-500">
                                     <div className="flex flex-col items-center">
                                        <CubeIcon className="w-10 h-10 text-gray-400 mb-3"/>
                                        <span className="font-medium">لا توجد بيانات ربحية لعرضها.</span>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ProductProfitabilityTable;
