import React, { useState, useRef, useEffect } from 'react';
import { TimeFilter, SourceFilter, SeasonFilter, CustomDateRange, Product, ComparisonTimeFilter } from '../../../shared/types';
import { GlobeIcon, SunIcon, SnowflakeIcon, CalendarIcon, CubeIcon, ChevronDownIcon, ScaleIcon, CheckIcon } from '../../../shared/components/Icons';

interface FilterState {
    timeFilter: TimeFilter;
    sourceFilter: SourceFilter;
    seasonFilter: SeasonFilter;
    productFilter: string;
    comparisonTimeFilter: ComparisonTimeFilter;
    customDateRange: CustomDateRange;
}

interface DashboardFiltersProps {
    initialFilters: FilterState;
    onApplyFilters: (filters: FilterState) => void;
    products: Product[];
}


const CustomSelect: React.FC<{
    options: { value: string, label: string, icon?: React.ComponentType<{className?: string}> }[];
    value: string;
    onChange: (value: string) => void;
    icon: React.ComponentType<{className?: string}>;
    label: string;
}> = ({ options, value, onChange, icon: Icon, label }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const selectedOption = options.find(opt => opt.value === value) || options[0];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [ref]);

    return (
        <div className="relative w-full" ref={ref}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-white border border-gray-200/80 rounded-xl px-3 py-2.5 flex items-center justify-between text-sm text-right transition-all duration-200 hover:border-gray-300 hover:shadow-sm"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg bg-orange-50 text-orange-500">
                        <Icon className="w-5 h-5"/>
                    </div>
                    <div>
                        <span className="block text-xs text-gray-500">{label}</span>
                        <span className="block font-semibold text-gray-800">{selectedOption.label}</span>
                    </div>
                </div>
                <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            
            <div className={`absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-2 transform transition-all duration-200 ease-in-out origin-top ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                 {options.map(option => (
                    <div
                        key={option.value}
                        onClick={() => {
                            onChange(option.value);
                            setIsOpen(false);
                        }}
                        className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-orange-50 flex items-center justify-between transition-colors ${value === option.value ? 'font-semibold text-orange-600' : 'text-gray-700'}`}
                    >
                        <div className="flex items-center gap-3">
                           {option.icon ? <option.icon className="w-5 h-5 text-gray-400" /> : <div className="w-5 h-5" />}
                           <span>{option.label}</span>
                        </div>
                        {value === option.value && <CheckIcon className="w-5 h-5 text-orange-600" />}
                    </div>
                ))}
            </div>
        </div>
    );
};

const DashboardFilters: React.FC<DashboardFiltersProps> = ({
    initialFilters,
    onApplyFilters,
    products,
}) => {

    const [pendingFilters, setPendingFilters] = useState(initialFilters);

    useEffect(() => {
        setPendingFilters(initialFilters);
    }, [initialFilters]);
    
    const handleFilterChange = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
        setPendingFilters(prev => ({...prev, [key]: value}));
    };

    const handleApply = () => {
        onApplyFilters(pendingFilters);
    };
    
    const handleReset = () => {
        const defaultFilters: FilterState = {
            timeFilter: TimeFilter.Month,
            sourceFilter: SourceFilter.All,
            seasonFilter: SeasonFilter.All,
            productFilter: 'ALL',
            comparisonTimeFilter: ComparisonTimeFilter.PreviousPeriod,
            customDateRange: { start: '', end: '' },
        };
        setPendingFilters(defaultFilters);
        onApplyFilters(defaultFilters);
    };

    const timeFilterOptions = [
        { label: 'الكل', value: TimeFilter.All }, { label: 'اليوم', value: TimeFilter.Today },
        { label: 'أسبوع', value: TimeFilter.Week }, { label: 'شهر', value: TimeFilter.Month },
        { label: 'ربع سنوي', value: TimeFilter.Quarter }, { label: 'سنة', value: TimeFilter.Year },
        { label: 'فترة مخصصة', value: TimeFilter.Custom }
    ];

    const sourceFilterOptions = [
        { label: 'كل المصادر', value: SourceFilter.All, icon: GlobeIcon },
        { label: 'الموقع', value: SourceFilter.Website, icon: GlobeIcon },
        { label: 'البيدج', value: SourceFilter.Page, icon: GlobeIcon }
    ];

    const seasonFilterOptions = [
        { label: 'كل المواسم', value: SeasonFilter.All, icon: GlobeIcon },
        { label: 'صيفي', value: SeasonFilter.Summer, icon: SunIcon },
        { label: 'شتوي', value: SeasonFilter.Winter, icon: SnowflakeIcon }
    ];

    const productFilterOptions = [
        { label: 'كل المنتجات', value: 'ALL', icon: CubeIcon },
        ...products.map(p => ({ label: p.name, value: p.id, icon: CubeIcon }))
    ];

    const comparisonFilterOptions = [
        { label: 'بدون مقارنة', value: ComparisonTimeFilter.None, icon: ScaleIcon },
        { label: 'مع الفترة السابقة', value: ComparisonTimeFilter.PreviousPeriod, icon: ScaleIcon },
        { label: 'مع نفس الفترة العام الماضي', value: ComparisonTimeFilter.PreviousYear, icon: ScaleIcon }
    ];

    return (
        <div className="relative z-10 bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-gray-200/80 shadow-sm">
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <CustomSelect options={timeFilterOptions} value={pendingFilters.timeFilter} onChange={(val) => handleFilterChange('timeFilter', val as TimeFilter)} icon={CalendarIcon} label="الفترة" />
                    <CustomSelect options={productFilterOptions} value={pendingFilters.productFilter} onChange={(val) => handleFilterChange('productFilter', val)} icon={CubeIcon} label="المنتج" />
                    <CustomSelect options={sourceFilterOptions} value={pendingFilters.sourceFilter} onChange={(val) => handleFilterChange('sourceFilter', val as SourceFilter)} icon={GlobeIcon} label="المصدر" />
                    <CustomSelect options={comparisonFilterOptions} value={pendingFilters.comparisonTimeFilter} onChange={(val) => handleFilterChange('comparisonTimeFilter', val as ComparisonTimeFilter)} icon={ScaleIcon} label="مقارنة مع" />
                </div>
                {pendingFilters.timeFilter === TimeFilter.Custom && (
                    <div className="flex items-center gap-4 pt-4 border-t border-gray-200 animate-fade-in">
                        <div className="flex-1">
                            <label className="text-xs text-gray-500 mb-1 block">من تاريخ</label>
                            <input type="date" value={pendingFilters.customDateRange.start} onChange={e => handleFilterChange('customDateRange', { ...pendingFilters.customDateRange, start: e.target.value })} className="w-full text-sm p-2 border border-gray-300 rounded-md"/>
                        </div>
                        <div className="flex-1">
                            <label className="text-xs text-gray-500 mb-1 block">إلى تاريخ</label>
                            <input type="date" value={pendingFilters.customDateRange.end} onChange={e => handleFilterChange('customDateRange', { ...pendingFilters.customDateRange, end: e.target.value })} className="w-full text-sm p-2 border border-gray-300 rounded-md"/>
                        </div>
                    </div>
                )}
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-gray-200">
                 <button type="button" onClick={handleReset} className="bg-gray-200 text-gray-800 font-semibold py-2 px-5 rounded-lg hover:bg-gray-300 transition-colors">
                    إعادة تعيين
                </button>
                <button type="button" onClick={handleApply} className="bg-emerald-600 text-white font-semibold py-2 px-5 rounded-lg hover:bg-emerald-700 transition-colors">
                    تطبيق الفلاتر
                </button>
            </div>
        </div>
    );
};

export default DashboardFilters;
