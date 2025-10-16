import React from 'react';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, BanknotesIcon, ArrowRightLeftIcon } from '../../../shared/components/Icons';
import { SpendVsRevenueShareData } from '../../../shared/types';
import { useDashboardData } from '../hooks/useDashboardData';

type AdEfficiencyData = ReturnType<typeof useDashboardData>['adEfficiency'];

interface AdEfficiencySectionProps {
    data: AdEfficiencyData;
    formatCurrency: (value: number) => string;
}

const InfoCard: React.FC<{ title: string; value: string; icon: React.ComponentType<{ className?: string }>; }> = ({ title, value, icon: Icon }) => (
    <div className="bg-white p-4 rounded-xl border border-gray-200/80 flex items-center gap-4">
        <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg bg-gray-100 text-gray-600">
            <Icon className="w-5 h-5" />
        </div>
        <div>
            <p className="text-sm text-gray-500 font-medium">{title}</p>
            <p className="text-lg font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

const AdEfficiencySection: React.FC<AdEfficiencySectionProps> = ({ data, formatCurrency }) => {
    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
            <h2 className="text-base font-semibold text-gray-800 mb-4">صف الكفاءة الإعلانية</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <InfoCard title="ROAS" value={`x${data.roas.toFixed(2)}`} icon={ArrowTrendingUpIcon} />
                    <InfoCard title="Ad Intensity (Ad/Sales)" value={`${(data.adIntensity * 100).toFixed(1)}%`} icon={ArrowRightLeftIcon} />
                    <InfoCard title="Profit per Ad Dollar" value={formatCurrency(data.profitPerAdDollar)} icon={BanknotesIcon} />
                </div>
                <div className="lg:col-span-2">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Spend vs Revenue Share Δ</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs font-bold text-emerald-600 uppercase mb-2">CHAMPIONS (إنفاق فعّال)</p>
                            <div className="space-y-2">
                                {data.spendVsRevenueShare.champions.length > 0 ? data.spendVsRevenueShare.champions.map(item => (
                                    <div key={item.productName} className="flex justify-between items-center text-xs p-2 bg-emerald-50/50 rounded-md">
                                        <span className="font-medium text-gray-800">{item.productName}</span>
                                        <span className="font-bold text-emerald-700">+{item.delta.toFixed(1)}%</span>
                                    </div>
                                )) : <p className="text-xs text-gray-400 p-2">لا توجد بيانات كافية.</p>}
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-red-600 uppercase mb-2">OFFENDERS (Over-spend)</p>
                             <div className="space-y-2">
                                {data.spendVsRevenueShare.offenders.length > 0 ? data.spendVsRevenueShare.offenders.map(item => (
                                    <div key={item.productName} className="flex justify-between items-center text-xs p-2 bg-red-50/50 rounded-md">
                                        <span className="font-medium text-gray-800">{item.productName}</span>
                                        <span className="font-bold text-red-700">{item.delta.toFixed(1)}%</span>
                                    </div>
                                )) : <p className="text-xs text-gray-400 p-2">لا توجد بيانات كافية.</p>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdEfficiencySection;
