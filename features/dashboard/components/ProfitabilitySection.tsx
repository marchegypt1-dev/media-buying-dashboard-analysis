import React from 'react';
import { BanknotesIcon, CalculatorIcon } from '../../../shared/components/Icons';
import { useDashboardData } from '../hooks/useDashboardData';

type ProfitabilityData = ReturnType<typeof useDashboardData>['profitability'];

interface ProfitabilitySectionProps {
    data: ProfitabilityData;
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

const ProfitabilitySection: React.FC<ProfitabilitySectionProps> = ({ data, formatCurrency }) => {
    
    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
            <h2 className="text-base font-semibold text-gray-800 mb-4">صف الربحية والهوامش</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoCard title="Gross Profit / Order" value={formatCurrency(data.grossProfitPerOrder)} icon={BanknotesIcon} />
                    <InfoCard title="Gross Profit / Unit" value={formatCurrency(data.grossProfitPerUnit)} icon={BanknotesIcon} />
                </div>
                 <div className="lg:col-span-2">
                     <h3 className="text-sm font-semibold text-gray-700 mb-3">تحليل نقطة التعادل</h3>
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                         <InfoCard title="Breakeven Gap (Sales)" value={formatCurrency(data.breakeven.gapSales)} icon={CalculatorIcon} />
                         <InfoCard title="BE Units (تقديري)" value={data.breakeven.beUnits} icon={CalculatorIcon} />
                         <InfoCard title="BE Gap %" value={`${data.breakeven.gapPercent.toFixed(1)}%`} icon={CalculatorIcon} />
                     </div>
                 </div>
            </div>
        </div>
    );
};

export default ProfitabilitySection;
