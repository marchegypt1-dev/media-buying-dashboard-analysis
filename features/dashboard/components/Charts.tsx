import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';
import { ChartBarIcon, TagIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '../../../shared/components/Icons';
import { CampaignPerformanceData } from '../../../shared/types';

const ChartEmptyState = ({ message, icon: Icon = ChartBarIcon }: { message: string, icon?: React.ComponentType<{className?: string}> }) => (
    <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
        <div className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-100 mb-3">
            <Icon className="w-6 h-6 text-gray-400"/>
        </div>
        <p className="text-sm font-medium text-gray-500">{message}</p>
    </div>
);

const TrendIndicator: React.FC<{ change: number | null, isPositiveGood?: boolean }> = ({ change, isPositiveGood = true }) => {
    if (change === null || change === 0 || !isFinite(change)) return <span className="text-gray-500 font-normal ml-1">(0.0%)</span>;

    const isPositive = change > 0;
    const color = (isPositive && isPositiveGood) || (!isPositive && !isPositiveGood) ? 'text-emerald-500' : 'text-red-500';
    const Icon = isPositive ? ArrowTrendingUpIcon : ArrowTrendingDownIcon;

    return (
        <span className={`flex items-center gap-1 text-xs font-semibold ml-2 ${color}`}>
            <Icon className="w-3 h-3"/>
            {Math.abs(change).toFixed(1)}%
        </span>
    );
};


interface SalesChartProps {
    data: { date: string; 'الفترة الحالية': number, 'الفترة السابقة'?: number }[];
    showComparison: boolean;
}
export const SalesChart: React.FC<SalesChartProps> = ({ data, showComparison }) => {
    if (data.length <= 1) {
        return <ChartEmptyState message="تحتاج ليومين من البيانات على الأقل لعرض الرسم البياني." />;
    }

    const CustomSalesTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const current = payload.find(p => p.dataKey === 'الفترة الحالية')?.value || 0;
            const previous = payload.find(p => p.dataKey === 'الفترة السابقة')?.value || 0;
            return (
                <div className="bg-white/90 backdrop-blur-sm p-3 rounded-xl border border-gray-200 shadow-lg min-w-[180px]">
                    <p className="label text-sm font-semibold text-gray-800 mb-2">{label}</p>
                    <div className="text-xs font-medium flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                            <span className="text-gray-600">الحالية:</span>
                        </div>
                        <span className="font-bold text-gray-900">{`د.ل ${Number(current).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}</span>
                    </div>
                    {showComparison && (
                        <div className="text-xs font-medium flex items-center justify-between gap-2 mt-1">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                                <span className="text-gray-600">السابقة:</span>
                            </div>
                            <span className="font-bold text-gray-900">{`د.ل ${Number(previous).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}</span>
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="previousSalesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a1a1aa" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#a1a1aa" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 0, 0, 0.05)" />
                <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis type="number" stroke="#6b7280" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(value: any) => `د.ل ${Number(value)/1000}k`} />
                <Tooltip content={<CustomSalesTooltip />} />
                {showComparison && <Area type="monotone" dataKey="الفترة السابقة" stroke="#a1a1aa" strokeWidth={2} fillOpacity={1} fill="url(#previousSalesGradient)" animationDuration={500} />}
                <Area type="monotone" dataKey="الفترة الحالية" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#salesGradient)" animationDuration={500} />
                {showComparison && <Legend wrapperStyle={{fontSize: "12px", paddingTop: '10px'}} />}
            </AreaChart>
        </ResponsiveContainer>
    );
};

interface ProductSalesChartProps {
    data: { name: string; 'Current Sales': number; 'Previous Sales'?: number }[];
    formatCurrency: (value: number) => string;
    showComparison: boolean;
}
export const ProductSalesChart: React.FC<ProductSalesChartProps> = ({ data, formatCurrency, showComparison }) => {
    if (data.length === 0) {
        return <ChartEmptyState message="لا توجد بيانات مبيعات للمنتجات." />;
    }

    const CustomProductTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const currentSales = payload.find(p => p.dataKey === 'Current Sales')?.value || 0;
            const previousSales = payload.find(p => p.dataKey === 'Previous Sales')?.value || 0;
            const change = previousSales > 0 ? ((currentSales - previousSales) / previousSales) * 100 : (currentSales > 0 ? Infinity : 0);
            
            return (
                <div className="bg-white/90 backdrop-blur-sm p-3 rounded-xl border border-gray-200 shadow-lg min-w-[220px]">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-800 mb-2">{label}</p>
                        {showComparison && <TrendIndicator change={change} />}
                    </div>
                    <div className="text-xs font-medium flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-orange-600"></span>
                            <span className="text-gray-600">المبيعات الحالية:</span>
                        </div>
                        <span className="font-bold text-gray-900">{formatCurrency(currentSales)}</span>
                    </div>
                    {showComparison && (
                        <div className="text-xs font-medium flex items-center justify-between gap-2 mt-1">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-orange-300"></span>
                                <span className="text-gray-600">المبيعات السابقة:</span>
                            </div>
                            <span className="font-bold text-gray-900">{formatCurrency(previousSales)}</span>
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 0, 0, 0.05)" />
                <XAxis type="number" stroke="#6b7280" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(value: any) => `${Number(value) / 1000}k`} />
                <YAxis dataKey="name" type="category" stroke="#6b7280" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={80} />
                <Tooltip content={<CustomProductTooltip />} cursor={{fill: 'rgba(0,0,0,0.05)'}} />
                {showComparison && <Legend wrapperStyle={{fontSize: "12px"}} />}
                {showComparison && <Bar dataKey="Previous Sales" name="الفترة السابقة" fill="#fdba74" background={{ fill: 'rgba(0, 0, 0, 0.03)' }} radius={[0, 4, 4, 0]} barSize={showComparison ? 8: 12} animationDuration={500}/>}
                <Bar dataKey="Current Sales" name="الفترة الحالية" fill="#f97316" background={{ fill: 'rgba(0, 0, 0, 0.03)' }} radius={[0, 4, 4, 0]} barSize={showComparison ? 8 : 12} animationDuration={500}/>
            </BarChart>
        </ResponsiveContainer>
    );
};


interface OrderDistributionChartProps {
    data: { name: string; value: number; fill: string }[];
    totalOrders: number;
    comparisonTotalOrders?: number;
    showComparison: boolean;
}
export const OrderDistributionChart: React.FC<OrderDistributionChartProps> = ({ data, totalOrders, comparisonTotalOrders, showComparison }) => {
    if (totalOrders === 0) {
        return <ChartEmptyState message="لا توجد أوردرات لعرض توزيعها." />;
    }
    const chartData = data.map(item => ({
        ...item,
        numOrders: Math.round(totalOrders * (item.value / 100)),
        comparisonNumOrders: showComparison ? Math.round((comparisonTotalOrders || 0) * (item.value / 100)) : 0
    }))

    const CustomPieTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const { numOrders, comparisonNumOrders } = data;
            return (
                <div className="bg-white/90 backdrop-blur-sm p-3 rounded-xl border border-gray-200 shadow-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: data.fill }}></span>
                        <p className="text-sm font-semibold text-gray-800">{data.name}</p>
                    </div>
                    <p className="text-xs text-gray-600 pl-4">
                        النسبة: <span className="font-bold text-gray-900">{data.value.toFixed(1)}%</span>
                    </p>
                    <p className="text-xs text-gray-600 mt-1 pl-4">
                        عدد الأوردرات: <span className="font-bold text-gray-900">{numOrders.toLocaleString()}</span>
                        {showComparison && <span className="text-gray-500 text-xs"> (مقابل {comparisonNumOrders.toLocaleString()})</span>}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={3} labelLine={false} label={({ name, percent }) => `${name} ${(Number(percent || 0) * 100).toFixed(0)}%`} isAnimationActive={true} animationDuration={800} animationEasing="ease-out">
                    {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} stroke={entry.fill} />)}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <foreignObject x="50%" y="50%" width="1" height="1" style={{ overflow: 'visible' }}>
                    <div style={{ transform: 'translate(-50%, -50%)' }} className="text-center">
                        <p className="text-2xl font-bold text-gray-800">{totalOrders.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">إجمالي الأوردرات</p>
                    </div>
                </foreignObject>
            </PieChart>
        </ResponsiveContainer>
    );
};
