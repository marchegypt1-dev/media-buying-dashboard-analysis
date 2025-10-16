import React, { useState, useMemo } from 'react';
import { TagIcon } from '../../../shared/components/Icons';
import { CampaignPerformanceData } from '../../../shared/types/index';

interface CampaignPerformanceTableProps {
    data: CampaignPerformanceData[];
    formatCurrency: (value: number) => string;
}

type SortKey = keyof CampaignPerformanceData | null;
type SortDirection = 'asc' | 'desc';

const SortableHeader: React.FC<{ 
    label: string; 
    sortKey: keyof CampaignPerformanceData; 
    currentSortKey: SortKey; 
    sortDirection: SortDirection; 
    onSort: (key: keyof CampaignPerformanceData) => void;
    className?: string;
}> = ({ label, sortKey, currentSortKey, sortDirection, onSort, className }) => {
    const isActive = currentSortKey === sortKey;
    const arrow = isActive ? (sortDirection === 'asc' ? '▲' : '▼') : '';
    return (
        <th className={`px-4 py-3 font-medium tracking-wider cursor-pointer select-none ${className}`} onClick={() => onSort(sortKey)}>
            {label} <span className="text-xs">{arrow}</span>
        </th>
    );
};

const CampaignPerformanceTable: React.FC<CampaignPerformanceTableProps> = ({ data, formatCurrency }) => {
    const [sortKey, setSortKey] = useState<SortKey>('netProfit');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    const handleSort = (key: keyof CampaignPerformanceData) => {
        if (sortKey === key) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('desc');
        }
    };

    const sortedData = useMemo(() => {
        if (!sortKey) return data;
        return [...data].sort((a, b) => {
            if (a[sortKey] < b[sortKey]) return sortDirection === 'asc' ? -1 : 1;
            if (a[sortKey] > b[sortKey]) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data, sortKey, sortDirection]);

    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
                <TagIcon className="w-5 h-5 text-gray-500" />
                <h2 className="text-base font-semibold text-gray-800">تحليل أداء الحملات الإعلانية</h2>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                        <tr>
                            <SortableHeader label="الحملة" sortKey="name" currentSortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} />
                            <SortableHeader label="المبيعات" sortKey="totalSales" currentSortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} />
                            <SortableHeader label="الإنفاق الإعلاني" sortKey="totalAdSpend" currentSortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} />
                            <SortableHeader label="الربح الصافي" sortKey="netProfit" currentSortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} />
                            <SortableHeader label="CPO" sortKey="cpo" currentSortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} />
                            <SortableHeader label="ROI" sortKey="roi" currentSortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} className="text-right"/>
                            <SortableHeader label="ROAS" sortKey="roas" currentSortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} className="text-right"/>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {sortedData.length > 0 ? sortedData.map(campaign => (
                            <tr key={campaign.name} className="hover:bg-gray-50 transition-colors duration-200">
                                <td className="px-4 py-4 font-semibold text-gray-900 whitespace-nowrap">{campaign.name}</td>
                                <td className="px-4 py-4 text-gray-700 font-medium">{formatCurrency(campaign.totalSales)}</td>
                                <td className="px-4 py-4 text-gray-700 font-medium">{formatCurrency(campaign.totalAdSpend)}</td>
                                <td className={`px-4 py-4 font-bold ${campaign.netProfit >= 0 ? 'text-sky-600' : 'text-red-600'}`}>
                                    {formatCurrency(campaign.netProfit)}
                                </td>
                                <td className="px-4 py-4 text-gray-700 font-medium">{formatCurrency(campaign.cpo)}</td>
                                <td className="px-4 py-4 text-gray-600 font-medium text-right">{campaign.roi.toFixed(2)}%</td>
                                <td className="px-4 py-4 text-gray-600 font-medium text-right">x{campaign.roas.toFixed(2)}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={7} className="text-center py-16 text-gray-500">
                                    <div className="flex flex-col items-center">
                                        <TagIcon className="w-10 h-10 text-gray-400 mb-3" />
                                        <span className="font-medium">لا توجد بيانات حملات لعرضها.</span>
                                        <span className="text-xs mt-1">تأكد من إدخال مصروف وأوردرات للحملات في صفحة الإدخال اليومي.</span>
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

export default CampaignPerformanceTable;