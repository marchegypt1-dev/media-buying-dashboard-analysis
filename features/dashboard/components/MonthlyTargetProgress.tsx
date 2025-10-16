import React from 'react';
import { TargetIcon } from '../../../shared/components/Icons';
import { useDashboardData } from '../hooks/useDashboardData';

type GoalsData = ReturnType<typeof useDashboardData>['goals'];

interface MonthlyTargetProgressProps {
    goals: GoalsData;
    formatCurrency: (value: number) => string;
}

interface CircularProgressProps {
    label: string;
    current: number;
    target: number;
    format: (val: number) => string;
    colorClass: string;
    percentage: number;
}

const CircularProgress: React.FC<CircularProgressProps> = ({ label, current, target, format, colorClass, percentage }) => {
    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;

    return (
        <div className="flex flex-col items-center text-center">
            <div className="relative w-32 h-32">
                <svg className="w-full h-full" viewBox="0 0 120 120">
                    <circle
                        className="text-gray-200"
                        strokeWidth="8"
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx="60"
                        cy="60"
                    />
                    <circle
                        className={colorClass}
                        strokeWidth="8"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx="60"
                        cy="60"
                        transform="rotate(-90 60 60)"
                        style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-gray-800">{Math.round(percentage)}%</span>
                </div>
            </div>
            <p className="mt-3 text-sm font-semibold text-gray-800">{label}</p>
            <p className="text-xs text-gray-500 mt-1">{format(current)} / {format(target)}</p>
        </div>
    );
};


const MonthlyTargetProgress: React.FC<MonthlyTargetProgressProps> = ({ goals, formatCurrency }) => {
    
    const progressItems = [
        {
            label: 'هدف المبيعات',
            current: goals.revenue.current,
            target: goals.revenue.target,
            format: formatCurrency,
            colorClass: 'text-orange-500'
        },
        {
            label: 'هدف القطع المباعة',
            current: goals.units.current,
            target: goals.units.target,
            format: (val: number) => val.toLocaleString(),
            colorClass: 'text-emerald-500'
        },
        {
            label: 'هدف الأوردرات',
            current: goals.orders.current,
            target: goals.orders.target,
            format: (val: number) => val.toLocaleString(),
            colorClass: 'text-sky-500'
        }
    ];

    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
                <TargetIcon className="w-5 h-5 text-gray-500" />
                <h2 className="text-base font-semibold text-gray-800">التقدم نحو الهدف الشهري</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {progressItems.map(item => {
                    const percentage = item.target > 0 ? (item.current / item.target) * 100 : 0;
                    return (
                        <CircularProgress
                            key={item.label}
                            label={item.label}
                            current={item.current}
                            target={item.target}
                            format={item.format}
                            colorClass={item.colorClass}
                            percentage={percentage}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default MonthlyTargetProgress;
