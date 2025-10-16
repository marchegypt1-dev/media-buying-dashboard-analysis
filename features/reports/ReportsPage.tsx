import React, { useState, useRef } from 'react';
import ReactToPrint from 'react-to-print';
import { useStore } from '../../shared/store/useStore';
import { useReportData } from './hooks/useReportData';
import { ReportConfig, ReportSection, SourceFilter, SeasonFilter, ReportData, Product } from '../../shared/types';
import { SalesChart, OrderDistributionChart } from '../dashboard/components/Charts';
import ProductProfitabilityTable from '../dashboard/components/ProductProfitabilityTable';
import CampaignPerformanceTable from '../dashboard/components/CampaignPerformanceTable';
import { DocumentChartBarIcon, CalendarIcon, CheckIcon, ChevronUpDownIcon, PrinterIcon } from '../../shared/components/Icons';
import toast from 'react-hot-toast';

const getInitialConfig = (): ReportConfig => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
    return {
        dateRange: { start: startOfMonth, end: endOfMonth },
        productIds: [], // All products
        source: SourceFilter.All,
        season: SeasonFilter.All,
        sections: Object.values(ReportSection),
    };
};

const reportSectionLabels: Record<ReportSection, string> = {
    [ReportSection.KPISummary]: 'ملخص المؤشرات',
    [ReportSection.SalesChart]: 'رسم المبيعات',
    [ReportSection.ProductProfitability]: 'ربحية المنتجات',
    [ReportSection.CampaignPerformance]: 'أداء الحملات',
    [ReportSection.OrderDistribution]: 'توزيع الأوردرات',
};

const MultiSelectProducts: React.FC<{
    products: Product[];
    selectedIds: string[];
    onChange: (selectedIds: string[]) => void;
}> = ({ products, selectedIds, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [ref]);

    const isAllSelected = selectedIds.length === 0 || selectedIds.length === products.length;

    const handleToggleAll = () => {
        onChange(isAllSelected ? [products[0]?.id] : []); // Deselect all by passing empty, select one to show "All but.."
    };
    
    const handleToggleProduct = (productId: string) => {
        let newSelectedIds;
        const currentlySelected = selectedIds.includes(productId);
        
        if (isAllSelected) {
            newSelectedIds = products.filter(p => p.id !== productId).map(p => p.id);
        } else {
             newSelectedIds = currentlySelected
                ? selectedIds.filter(id => id !== productId)
                : [...selectedIds, productId];
        }
        
        if (newSelectedIds.length === products.length) {
            onChange([]); // If all are manually selected, normalize to "All"
        } else {
            onChange(newSelectedIds);
        }
    };
    
    const label = isAllSelected ? "كل المنتجات" : `${selectedIds.length} منتجات محددة`;

    return (
        <div className="relative w-full" ref={ref}>
            <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full bg-white border border-gray-300 rounded-lg p-2.5 flex items-center justify-between text-right">
                <span className="text-gray-900 text-sm">{label}</span>
                <ChevronUpDownIcon className="w-5 h-5 text-gray-400" />
            </button>
            {isOpen && (
                <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-2 max-h-60 overflow-y-auto">
                    <div onClick={handleToggleAll} className="px-4 py-2 text-sm flex items-center gap-3 cursor-pointer hover:bg-gray-50">
                        <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500" checked={isAllSelected} readOnly/>
                        <span className="font-semibold">كل المنتجات</span>
                    </div>
                    <div className="border-t my-1"></div>
                    {products.map(product => (
                        <div key={product.id} onClick={() => handleToggleProduct(product.id)} className="px-4 py-2 text-sm flex items-center gap-3 cursor-pointer hover:bg-gray-50">
                            <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500" checked={isAllSelected || selectedIds.includes(product.id)} readOnly/>
                            <span>{product.name}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};


const ReportsPage: React.FC = () => {
    const { products } = useStore();
    const [config, setConfig] = useState<ReportConfig>(getInitialConfig());
    const [activeConfig, setActiveConfig] = useState<ReportConfig | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeTab, setActiveTab] = useState<ReportSection>(ReportSection.KPISummary);

    const reportData = useReportData(activeConfig);
    const reportRef = useRef<HTMLDivElement>(null);

    const handlePrint = (ReactToPrint as any).useReactToPrint({
        content: () => reportRef.current,
        documentTitle: `Report-${new Date().toISOString().split('T')[0]}`,
        onAfterPrint: () => toast.success("تم إنشاء ملف PDF بنجاح!"),
    });
    
    const handleGenerateReport = () => {
        if (!config.dateRange.start || !config.dateRange.end) {
            toast.error("الرجاء تحديد تاريخ البدء والانتهاء.");
            return;
        }
         if (new Date(config.dateRange.start) > new Date(config.dateRange.end)) {
            toast.error("تاريخ البدء لا يمكن أن يكون بعد تاريخ الانتهاء.");
            return;
        }
        if (config.sections.length === 0) {
            toast.error("الرجاء اختيار قسم واحد على الأقل لعرضه في التقرير.");
            return;
        }
        
        setIsGenerating(true);
        setActiveConfig(config);
        setTimeout(() => {
           setIsGenerating(false);
           setActiveTab(config.sections[0] || ReportSection.KPISummary);
        }, 500); 
    };

    const formatCurrency = (value: number) => `د.ل ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const ReportPreview: React.FC<{ data: ReportData }> = ({ data }) => {
        const renderSection = (section: ReportSection) => {
            switch (section) {
                case ReportSection.KPISummary:
                    const kpis = [
                        { label: 'إجمالي المبيعات', value: formatCurrency(data.totalSales) },
                        { label: 'صافي الربح', value: formatCurrency(data.grossProfit) },
                        { label: 'إجمالي الأوردرات', value: data.totalOrders.toLocaleString() },
                        { label: 'إجمالي القطع', value: data.totalUnitsSold.toLocaleString() },
                        { label: 'تكلفة الأوردر (CPO)', value: formatCurrency(data.cpo) },
                        { label: 'تكلفة القطعة (CPS)', value: formatCurrency(data.cps) },
                        { label: 'ROAS', value: `x${data.roas.toFixed(2)}` },
                        { label: 'ROI', value: `${data.roi.toFixed(1)}%` },
                        { label: 'AOV', value: formatCurrency(data.aov) },
                        { label: 'UPT', value: data.upt.toFixed(2) },
                    ];
                    return (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            {kpis.map(kpi => (
                                <div key={kpi.label} className="bg-gray-50 p-4 rounded-lg border">
                                    <p className="text-sm text-gray-600">{kpi.label}</p>
                                    <p className="text-xl font-bold text-gray-900 mt-1">{kpi.value}</p>
                                </div>
                            ))}
                        </div>
                    );
                case ReportSection.SalesChart:
                    return <SalesChart data={data.salesChartData.map(d => ({ date: d.date, 'الفترة الحالية': d['إجمالي المبيعات'] }))} showComparison={false} />;
                case ReportSection.ProductProfitability:
                    return <ProductProfitabilityTable data={data.productProfitabilityData} formatCurrency={formatCurrency} />;
                case ReportSection.CampaignPerformance:
                    return <CampaignPerformanceTable data={data.campaignPerformanceData} formatCurrency={formatCurrency} />;
                case ReportSection.OrderDistribution:
                    return <OrderDistributionChart data={data.orderDistributionData} totalOrders={data.totalOrders} showComparison={false} comparisonTotalOrders={0} />;
                default:
                    return null;
            }
        };

        return (
            <div className="mt-8">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-4 overflow-x-auto" aria-label="Tabs">
                        {config.sections.map(section => (
                            <button key={section} onClick={() => setActiveTab(section)}
                                className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === section ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                            >
                                {reportSectionLabels[section]}
                            </button>
                        ))}
                    </nav>
                </div>
                <div className="mt-6">
                    {config.sections.map(section => (
                        <div key={section} style={{ display: activeTab === section ? 'block' : 'none' }}>
                            {renderSection(section)}
                        </div>
                    ))}
                </div>
            </div>
        );
    };


    return (
        <div className="space-y-8">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3"><DocumentChartBarIcon className="w-8 h-8 text-orange-500" /> التقارير المخصصة</h1>
                    <p className="mt-1 text-gray-500">قم ببناء وتصدير تقارير مفصلة بناءً على احتياجاتك.</p>
                </div>
                {reportData && (
                    <button onClick={handlePrint} className="flex items-center gap-2 bg-gray-800 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-900 transition-colors">
                        <PrinterIcon className="w-5 h-5"/>
                        طباعة التقرير
                    </button>
                )}
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
                <h3 className="font-semibold text-lg mb-4">إعدادات التقرير</h3>
                <div className="space-y-6">
                    {/* Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-2">من تاريخ</label>
                            <input type="date" value={config.dateRange.start} onChange={e => setConfig(c => ({ ...c, dateRange: { ...c.dateRange, start: e.target.value } }))} className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-gray-900 text-sm" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-2">إلى تاريخ</label>
                            <input type="date" value={config.dateRange.end} onChange={e => setConfig(c => ({ ...c, dateRange: { ...c.dateRange, end: e.target.value } }))} className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-gray-900 text-sm" />
                        </div>
                        <div>
                             <label className="text-sm font-medium text-gray-700 block mb-2">المنتجات</label>
                             <MultiSelectProducts products={products} selectedIds={config.productIds} onChange={ids => setConfig(c => ({ ...c, productIds: ids }))} />
                        </div>
                        <div>
                             <label className="text-sm font-medium text-gray-700 block mb-2">المصدر</label>
                             <select value={config.source} onChange={e => setConfig(c => ({ ...c, source: e.target.value as SourceFilter }))} className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-gray-900 text-sm">
                                <option value={SourceFilter.All}>كل المصادر</option>
                                <option value={SourceFilter.Website}>الموقع</option>
                                <option value={SourceFilter.Page}>البيدج</option>
                             </select>
                        </div>
                    </div>
                    {/* Sections */}
                    <div>
                         <label className="text-sm font-medium text-gray-700 block mb-3">أقسام التقرير</label>
                         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                            {Object.values(ReportSection).map(section => (
                                <label key={section} className="flex items-center gap-2 p-3 bg-gray-50 border rounded-lg cursor-pointer hover:bg-gray-100">
                                    <input type="checkbox"
                                        checked={config.sections.includes(section)}
                                        onChange={() => {
                                            setConfig(c => ({
                                                ...c,
                                                sections: c.sections.includes(section)
                                                    ? c.sections.filter(s => s !== section)
                                                    : [...c.sections, section]
                                            }))
                                        }}
                                        className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                    />
                                    <span className="text-sm text-gray-800">{reportSectionLabels[section]}</span>
                                </label>
                            ))}
                         </div>
                    </div>
                    {/* Actions */}
                    <div className="pt-4 border-t flex justify-end">
                        <button onClick={handleGenerateReport} disabled={isGenerating} className="bg-orange-500 text-white font-semibold py-2.5 px-6 rounded-lg hover:bg-orange-600 transition-colors disabled:bg-orange-300 disabled:cursor-not-allowed flex items-center gap-2">
                             {isGenerating ? 'جاري الإنشاء...' : 'إنشاء التقرير'}
                        </button>
                    </div>
                </div>
            </div>

            {reportData && (
                <div ref={reportRef} className="bg-white p-8 rounded-2xl border border-gray-200/80 shadow-sm print:shadow-none print:border-none">
                   <div className="print:block hidden mb-8">
                        <h2 className="text-2xl font-bold">تقرير الأداء</h2>
                        <p className="text-sm text-gray-500">من {activeConfig?.dateRange.start} إلى {activeConfig?.dateRange.end}</p>
                   </div>
                   <ReportPreview data={reportData} />
                </div>
            )}
        </div>
    );
};

export default ReportsPage;
