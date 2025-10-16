import React from 'react';
import { InformationCircleIcon } from '../../../shared/components/Icons';

interface TrendIndicatorProps {
    value: number | null;
    type: 'positive' | 'negative' | 'neutral';
    isPositiveGood: boolean;
}

const TrendIndicator: React.FC<TrendIndicatorProps> = ({ value, type, isPositiveGood }) => {
    if (value === null || !isFinite(value)) {
        return <span className="text-gray-500 font-normal ml-1">(vs --)</span>;
    }
    
    let colorClass = 'text-gray-500';
    if (type === 'positive' && isPositiveGood) colorClass = 'text-emerald-500';
    if (type === 'positive' && !isPositiveGood) colorClass = 'text-red-500';
    if (type === 'negative' && isPositiveGood) colorClass = 'text-red-500';
    if (type === 'negative' && !isPositiveGood) colorClass = 'text-emerald-500';

    const sign = value > 0 ? '+' : '';

    return (
        <span className={`text-xs font-semibold ml-2 ${colorClass}`}>
            {sign}{value.toFixed(1)}%
        </span>
    );
};


interface KPICardProps {
    title: string;
    value: string;
    subValue?: string;
    trend: {
        value: number | null;
        type: 'positive' | 'negative' | 'neutral';
    };
    isPositiveGood?: boolean;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, subValue, trend, isPositiveGood = true, icon: Icon, color }) => {
    return (
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-start justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <div className="flex items-baseline gap-2 mt-2">
                    <p className="text-2xl font-bold text-gray-800">{value}</p>
                    {subValue && (
                         <div className="relative group flex items-center">
                            <InformationCircleIcon className="w-4 h-4 text-gray-400 cursor-pointer" />
                            <div className="absolute bottom-full mb-2 w-max bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                                {subValue}
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex items-center mt-2">
                    <span className="text-xs text-gray-500">vs prev. period</span>
                    <TrendIndicator value={trend.value} type={trend.type} isPositiveGood={isPositiveGood} />
                </div>
            </div>
            <div className={`w-10 h-10 flex items-center justify-center rounded-lg flex-shrink-0 ${color}`}>
                <Icon className="w-5 h-5 text-white" />
            </div>
        </div>
    );
};

export default KPICard;
