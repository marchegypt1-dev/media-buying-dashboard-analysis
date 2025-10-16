import React, { useState } from 'react';
import { useStore } from '../../shared/store/useStore';
import { useDashboardData } from './hooks/useDashboardData';
import { TimeFilter, SourceFilter, SeasonFilter, ComparisonTimeFilter, DailyEntry } from '../../shared/types';
import toast from 'react-hot-toast';

import DashboardFilters from './components/DashboardFilters';
import KPICardsGrid from './components/KPICardsGrid';
import CPOAlerts from './components/CPOAlerts';
import StockAlerts from './components/StockAlerts';
import MonthlyTargetProgress from './components/MonthlyTargetProgress';
import DailyEntriesTable from './components/DailyEntriesTable';
import EditEntryModal from './components/EditEntryModal';
import ProductProfitabilityTable from './components/ProductProfitabilityTable';
import CampaignPerformanceTable from './components/CampaignPerformanceTable';
import { SalesChart, ProductSalesChart, OrderDistributionChart } from './components/Charts';
import AdEfficiencySection from './components/AdEfficiencySection';
import ProfitabilitySection from './components/ProfitabilitySection';

const DashboardPage: React.FC = () => {
    const { products, updateDailyEntry, deleteDailyEntry } = useStore();
    const [editingEntry, setEditingEntry] = useState<DailyEntry | null>(null);
    
    const [filters, setFilters] = useState({
        timeFilter: TimeFilter.Month,
        sourceFilter: SourceFilter.All,
        seasonFilter: SeasonFilter.All,
        productFilter: 'ALL',
        comparisonTimeFilter: ComparisonTimeFilter.PreviousPeriod,
        customDateRange: { start: '', end: '' },
    });

    const dashboardData = useDashboardData(filters);

    const formatCurrency = (value: number) => `د.ل ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    const handleSaveEntry = (updatedEntry: DailyEntry) => {
        updateDailyEntry(updatedEntry);
        setEditingEntry(null);
        toast.success("Entry updated successfully!");
    };

    return (
        <div className="space-y-8">
            <DashboardFilters 
                initialFilters={filters}
                onApplyFilters={setFilters}
                products={products}
            />
            
            <div className="space-y-4">
                 <CPOAlerts alerts={dashboardData.cpoAlerts} formatCurrency={formatCurrency} />
                 <StockAlerts alerts={dashboardData.stockAlerts} />
            </div>

            <KPICardsGrid kpis={dashboardData.kpis} />

            <AdEfficiencySection data={dashboardData.adEfficiency} formatCurrency={formatCurrency} />

            <ProfitabilitySection data={dashboardData.profitability} formatCurrency={formatCurrency} />

            <MonthlyTargetProgress goals={dashboardData.goals} formatCurrency={formatCurrency} />

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
                    <h2 className="text-base font-semibold text-gray-800 mb-4">تحليل المبيعات</h2>
                    <SalesChart data={dashboardData.salesChartData} showComparison={filters.comparisonTimeFilter !== ComparisonTimeFilter.None} />
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
                    <h2 className="text-base font-semibold text-gray-800 mb-4">توزيع الأوردرات</h2>
                    <OrderDistributionChart 
                        data={dashboardData.orderDistributionData} 
                        totalOrders={dashboardData.mainMetrics.totalOrders}
                        comparisonTotalOrders={dashboardData.mainMetrics.comparisonTotalOrders}
                        showComparison={filters.comparisonTimeFilter !== ComparisonTimeFilter.None}
                    />
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
                <h2 className="text-base font-semibold text-gray-800 mb-4">مبيعات المنتجات</h2>
                <ProductSalesChart data={dashboardData.productSalesChartData} formatCurrency={formatCurrency} showComparison={filters.comparisonTimeFilter !== ComparisonTimeFilter.None} />
            </div>

            <CampaignPerformanceTable data={dashboardData.campaignPerformanceData} formatCurrency={formatCurrency} />
            
            <ProductProfitabilityTable data={dashboardData.productProfitabilityData} formatCurrency={formatCurrency} />
            
            <DailyEntriesTable 
                entries={dashboardData.allFilteredEntries} 
                products={products} 
                deleteDailyEntry={deleteDailyEntry}
                onEditEntry={setEditingEntry}
                formatCurrency={formatCurrency}
            />

            {editingEntry && (
                <EditEntryModal 
                    entry={editingEntry}
                    products={products}
                    onClose={() => setEditingEntry(null)}
                    onSave={handleSaveEntry}
                />
            )}
        </div>
    );
};

export default DashboardPage;
