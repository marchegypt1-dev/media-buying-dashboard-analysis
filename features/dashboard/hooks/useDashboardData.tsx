import React, { useMemo } from 'react';
import { useStore } from '../../../shared/store/useStore';
import {
    DailyEntry, Product, Settings, EntryType, TimeFilter, ComparisonTimeFilter,
    CustomDateRange, CPOAlert, StockAlert, CampaignPerformanceData, ProfitabilityData,
    SpendVsRevenueShareData
} from '../../../shared/types';
import { subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, differenceInDays, format, subYears } from 'date-fns';
import {
    MoneyIcon, ScaleIcon, TruckIcon, CubeIcon, ArrowTrendingUpIcon, ReceiptPercentIcon,
    ChartBarIcon, PackageIcon, DocumentChartBarIcon, BanknotesIcon
} from '../../../shared/components/Icons';


// --- UTILITY FUNCTIONS ---

const safeDivide = (numerator: number, denominator: number): number => {
    if (denominator === 0 || !isFinite(denominator)) return 0;
    return numerator / denominator;
};

const getTrend = (current: number, previous: number): { value: number | null; type: 'positive' | 'negative' | 'neutral' } => {
    if (previous === 0) {
        return { value: current > 0 ? Infinity : 0, type: current > 0 ? 'positive' : 'neutral' };
    }
    if (current === previous) {
        return { value: 0, type: 'neutral' };
    }
    const change = ((current - previous) / Math.abs(previous)) * 100;
    if (!isFinite(change)) return { value: null, type: 'neutral' };

    return {
        value: change,
        type: change > 0 ? 'positive' : 'negative'
    };
};

export interface IKPI {
    title: string;
    value: string;
    subValue?: string;
    trend: { value: number | null; type: 'positive' | 'negative' | 'neutral'; };
    isPositiveGood: boolean;
    icon: React.ComponentType<{ className?: string; }>;
    color: string;
}

// --- DATA PROCESSING LOGIC ---

const getEffectiveEntries = (entries: DailyEntry[]): DailyEntry[] => {
    const groupsByDate = new Map<string, { final: DailyEntry | null, subs: DailyEntry[] }>();

    for (const entry of entries) {
        const key = entry.date;
        if (!groupsByDate.has(key)) {
            groupsByDate.set(key, { final: null, subs: [] });
        }
        const group = groupsByDate.get(key)!;
        if (entry.entryType === EntryType.Final) {
            group.final = entry;
        } else {
            group.subs.push(entry);
        }
    }

    const effective: DailyEntry[] = [];
    for (const group of groupsByDate.values()) {
        if (group.final) {
            effective.push(group.final);
        } else if (group.subs.length > 0) {
            const latestSub = group.subs.sort((a, b) => b.time.localeCompare(a.time))[0];
            const campaignTotals = new Map<string, { adSpend: number; orders: number }>();
            
            group.subs.forEach(sub => {
                sub.campaigns.forEach(c => {
                    const current = campaignTotals.get(c.id) || { adSpend: 0, orders: 0 };
                    campaignTotals.set(c.id, {
                        adSpend: current.adSpend + c.adSpend,
                        orders: current.orders + c.orders
                    });
                });
            });

            const product = useStore.getState().products.find(p => p.id === latestSub.productId);
            
            const consolidatedEntry: DailyEntry = {
                ...latestSub,
                campaigns: product?.campaigns.map(pc => ({
                    id: pc.id,
                    name: pc.name,
                    adSpend: campaignTotals.get(pc.id)?.adSpend || 0,
                    orders: campaignTotals.get(pc.id)?.orders || 0,
                })).filter(c => c.adSpend > 0 || c.orders > 0) || [],
            };
            effective.push(consolidatedEntry);
        }
    }
    return effective;
};

const calculatePeriodMetrics = (entries: DailyEntry[], products: Product[], settings: Settings) => {
    let totalOrdersInput = 0, totalUnitsSoldInput = 0, totalAdSpendEGP = 0;
    let totalSales = 0, totalCOGS = 0, totalOtherFixed = 0;
    let effectiveOrders = 0, effectiveUnits = 0;

    const productMap = new Map(products.map(p => [p.id, p]));
    const productAdSpend = new Map<string, number>();
    const productSales = new Map<string, number>();

    entries.forEach(entry => {
        const product = productMap.get(entry.productId);
        if (!product) return;

        totalOrdersInput += entry.totalOrders;
        totalUnitsSoldInput += entry.totalUnitsSold;

        const deliveryRate = (product.productDeliveryRate ?? settings.globalDeliveryRate) / 100;
        const currentEffectiveUnits = entry.totalUnitsSold * deliveryRate;
        const currentEffectiveOrders = entry.totalOrders * deliveryRate;
        
        effectiveUnits += currentEffectiveUnits;
        effectiveOrders += currentEffectiveOrders;

        const revenue = currentEffectiveUnits * product.sellingPricePerUnit;
        totalSales += revenue;
        totalCOGS += currentEffectiveUnits * product.costPerUnit;
        totalOtherFixed += currentEffectiveUnits * (product.otherFixedCostsPerUnit || 0);
        productSales.set(product.id, (productSales.get(product.id) || 0) + revenue);

        let entryAdSpendEGP = 0;
        entry.campaigns.forEach(c => {
            entryAdSpendEGP += c.adSpend;
            productAdSpend.set(product.id, (productAdSpend.get(product.id) || 0) + c.adSpend);
        });
        totalAdSpendEGP += entryAdSpendEGP;
    });

    const totalAdSpend = totalAdSpendEGP / settings.libyanDinarExchangeRate;
    const grossProfit = totalSales - (totalAdSpend + totalCOGS + totalOtherFixed);
    const totalInvestment = totalAdSpend + totalCOGS + totalOtherFixed;
    
    return {
        totalOrdersInput, totalUnitsSoldInput, totalAdSpend,
        totalSales, totalCOGS, totalOtherFixed, grossProfit,
        effectiveOrders, effectiveUnits, totalInvestment,
        productAdSpend, productSales
    };
};


const getDateRange = (filter: TimeFilter, customRange: CustomDateRange): [Date, Date] => {
    const now = new Date();
    switch (filter) {
        case TimeFilter.Today:
             const endOfToday = new Date(); endOfToday.setHours(23, 59, 59, 999);
             return [new Date(now.setHours(0,0,0,0)), endOfToday];
        case TimeFilter.Week: return [startOfWeek(now), endOfWeek(now)];
        case TimeFilter.Month: return [startOfMonth(now), endOfMonth(now)];
        case TimeFilter.Quarter: return [startOfQuarter(now), endOfQuarter(now)];
        case TimeFilter.Year: return [startOfYear(now), endOfYear(now)];
        case TimeFilter.Custom:
             if (!customRange.start || !customRange.end) return [now, now];
             return [new Date(customRange.start), new Date(new Date(customRange.end).setHours(23,59,59,999))];
        default: return [new Date(0), new Date()];
    }
};

interface FilterState {
    timeFilter: TimeFilter; sourceFilter: any; seasonFilter: any;
    productFilter: string; comparisonTimeFilter: ComparisonTimeFilter;
    customDateRange: CustomDateRange;
}

export const useDashboardData = (filters: FilterState) => {
    const { dailyEntries, products, settings } = useStore();

    return useMemo(() => {
        const { timeFilter, sourceFilter, seasonFilter, productFilter, comparisonTimeFilter, customDateRange } = filters;
        const [startDate, endDate] = getDateRange(timeFilter, customDateRange);
        
        const allEffectiveEntries = getEffectiveEntries(dailyEntries);

        const filterLogic = (entries: DailyEntry[], start: Date, end: Date) => entries.filter(entry => {
            const entryDate = new Date(entry.date);
            const product = products.find(p => p.id === entry.productId);
            if (!product) return false;
            
            return entryDate >= start && entryDate <= end &&
                (productFilter === 'ALL' || entry.productId === productFilter) &&
                (sourceFilter === 'ALL' || entry.source === sourceFilter) &&
                (seasonFilter === 'ALL' || product.season === seasonFilter);
        });

        const filteredEntries = filterLogic(allEffectiveEntries, startDate, endDate);

        let comparisonEntries: DailyEntry[] = [];
        const showComparison = comparisonTimeFilter !== ComparisonTimeFilter.None;
        if (showComparison) {
            const daysDiff = differenceInDays(endDate, startDate);
            const compStartDate = comparisonTimeFilter === ComparisonTimeFilter.PreviousPeriod ? subDays(startDate, daysDiff + 1) : subYears(startDate, 1);
            const compEndDate = comparisonTimeFilter === ComparisonTimeFilter.PreviousPeriod ? subDays(endDate, daysDiff + 1) : subYears(endDate, 1);
            comparisonEntries = filterLogic(allEffectiveEntries, compStartDate, compEndDate);
        }

        const current = calculatePeriodMetrics(filteredEntries, products, settings);
        const previous = calculatePeriodMetrics(comparisonEntries, products, settings);

        // Assemble Top KPIs
        const kpis: IKPI[] = [
            { title: 'Total Orders', value: current.totalOrdersInput.toLocaleString(), trend: getTrend(current.totalOrdersInput, previous.totalOrdersInput), isPositiveGood: true, icon: TruckIcon, color: 'bg-sky-500' },
            { title: 'Total Units Sold', value: current.totalUnitsSoldInput.toLocaleString(), trend: getTrend(current.totalUnitsSoldInput, previous.totalUnitsSoldInput), isPositiveGood: true, icon: CubeIcon, color: 'bg-indigo-500' },
            { title: 'Total Ad Spend', value: `د.ل ${current.totalAdSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, trend: getTrend(current.totalAdSpend, previous.totalAdSpend), isPositiveGood: false, icon: BanknotesIcon, color: 'bg-pink-500' },
            { title: 'Applied Delivery Rate', value: `${(safeDivide(current.effectiveOrders, current.totalOrdersInput) * 100).toFixed(1)}%`, trend: getTrend(safeDivide(current.effectiveOrders, current.totalOrdersInput), safeDivide(previous.effectiveOrders, previous.totalOrdersInput)), isPositiveGood: true, icon: DocumentChartBarIcon, color: 'bg-slate-500' },
            { title: 'Total Sales (Revenue)', value: `د.ل ${current.totalSales.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, trend: getTrend(current.totalSales, previous.totalSales), isPositiveGood: true, icon: MoneyIcon, color: 'bg-orange-500' },
            { title: 'Gross Profit (GP)', value: `د.ل ${current.grossProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, trend: getTrend(current.grossProfit, previous.grossProfit), isPositiveGood: true, icon: ScaleIcon, color: 'bg-emerald-500' },
            // FIX: Add parentheses to correctly calculate ROI before calling toFixed.
            { title: 'ROI %', value: `${(safeDivide(current.grossProfit, current.totalInvestment) * 100).toFixed(1)}%`, trend: getTrend(safeDivide(current.grossProfit, current.totalInvestment), safeDivide(previous.grossProfit, previous.totalInvestment)), isPositiveGood: true, icon: ReceiptPercentIcon, color: 'bg-cyan-500' },
            { title: 'CPO', value: `د.ل ${safeDivide(current.totalAdSpend, current.effectiveOrders).toFixed(2)}`, trend: getTrend(safeDivide(current.totalAdSpend, current.effectiveOrders), safeDivide(previous.totalAdSpend, previous.effectiveOrders)), isPositiveGood: false, icon: PackageIcon, color: 'bg-red-500' },
            { title: 'CPS', value: `د.ل ${safeDivide(current.totalAdSpend, current.effectiveUnits).toFixed(2)}`, trend: getTrend(safeDivide(current.totalAdSpend, current.effectiveUnits), safeDivide(previous.totalAdSpend, previous.effectiveUnits)), isPositiveGood: false, icon: PackageIcon, color: 'bg-rose-500' },
            { title: 'AOV', value: `د.ل ${safeDivide(current.totalSales, current.effectiveOrders).toFixed(2)}`, subValue: `Avg Units/Order: ${safeDivide(current.totalUnitsSoldInput, current.totalOrdersInput).toFixed(2)}`, trend: getTrend(safeDivide(current.totalSales, current.effectiveOrders), safeDivide(previous.totalSales, previous.effectiveOrders)), isPositiveGood: true, icon: ChartBarIcon, color: 'bg-purple-500' },
        ];
        
        // Ad Efficiency Section
        const spendVsRevenueShareData = Array.from(current.productAdSpend.entries()).map(([productId, adSpendEGP]) => {
            const product = products.find(p=> p.id === productId)!;
            const spendShare = safeDivide(adSpendEGP, (current.totalAdSpend * settings.libyanDinarExchangeRate));
            const revShare = safeDivide(current.productSales.get(productId) || 0, current.totalSales);
            return {
                productName: product.name,
                delta: (revShare - spendShare) * 100
            };
        }).sort((a,b) => b.delta - a.delta);
        
        const adEfficiency = {
            roas: safeDivide(current.totalSales, current.totalAdSpend),
            adIntensity: safeDivide(current.totalAdSpend, current.totalSales),
            profitPerAdDollar: safeDivide(current.grossProfit, current.totalAdSpend),
            spendVsRevenueShare: {
                champions: spendVsRevenueShareData.filter(d => d.delta > 0).slice(0, 3),
                offenders: spendVsRevenueShareData.filter(d => d.delta < 0).reverse().slice(0, 3),
            }
        };

        // Profitability Section
        const unitMargin = safeDivide(current.grossProfit, current.effectiveUnits);
        const beUnits = safeDivide(current.totalInvestment, unitMargin);

        const profitability = {
            grossProfitPerOrder: safeDivide(current.grossProfit, current.effectiveOrders),
            grossProfitPerUnit: unitMargin,
            breakeven: {
                gapSales: current.totalInvestment - current.totalSales,
                beUnits: (unitMargin <= 0 || !isFinite(beUnits)) ? "غير قابل للتحقيق" : Math.ceil(beUnits).toLocaleString(),
                gapPercent: safeDivide(current.totalInvestment - current.totalSales, current.totalInvestment) * 100,
            }
        };

        const goals = {
             revenue: { current: current.totalSales, target: settings.monthlyTargetRevenue },
             units: { current: current.totalUnitsSoldInput, target: settings.monthlyTargetUnitsSold },
             orders: { current: current.totalOrdersInput, target: settings.monthlyTargetOrders }
        };

        const productSalesChartData = Array.from(current.productSales.entries()).map(([productId, sales]) => ({
            name: products.find(p => p.id === productId)?.name || 'Unknown',
            'Current Sales': sales,
            'Previous Sales': previous.productSales.get(productId) || 0,
        }));
        
        const allFilteredEntriesForTable = dailyEntries.filter(entry => {
             const entryDate = new Date(entry.date);
             return entryDate >= startDate && entryDate <= endDate;
        });

        const mainMetrics = {
            totalOrders: current.totalOrdersInput,
            comparisonTotalOrders: previous.totalOrdersInput,
        };

        const { orderDistribution1Unit, orderDistribution2Units, orderDistribution3Units, orderDistributionMoreThan3Units } = settings;
        const totalDist = orderDistribution1Unit + orderDistribution2Units + orderDistribution3Units + orderDistributionMoreThan3Units;
        const normalize = (val: number) => totalDist > 0 ? (val / totalDist) * 100 : 0;
        
        const orderDistributionData = [
            { name: 'قطعة واحدة', value: normalize(orderDistribution1Unit), fill: '#f97316' },
            { name: 'قطعتين', value: normalize(orderDistribution2Units), fill: '#fb923c' },
            { name: '3 قطع', value: normalize(orderDistribution3Units), fill: '#fdba74' },
            { name: 'أكثر من 3 قطع', value: normalize(orderDistributionMoreThan3Units), fill: '#fed7aa' },
        ];

        return {
            kpis, adEfficiency, profitability, goals, mainMetrics,
            orderDistributionData,
            productSalesChartData,
            cpoAlerts: [], 
            stockAlerts: [], 
            salesChartData: [], 
            campaignPerformanceData: [],
            productProfitabilityData: [],
            allFilteredEntries: allFilteredEntriesForTable,
        };

    }, [filters, dailyEntries, products, settings]);
};
