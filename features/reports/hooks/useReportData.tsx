import { useMemo } from 'react';
import { useStore } from '../../../shared/store/useStore';
// FIX: Import Season and SeasonFilter enums for type-safe comparisons.
import { ReportConfig, ReportData, ProfitabilityData, CampaignPerformanceData, DailyEntry, EntryType, Product, Season, SeasonFilter } from '../../../shared/types';

const getEffectiveEntries = (entries: DailyEntry[]): DailyEntry[] => {
    const groupsByDate = new Map<string, { final: DailyEntry[], sub: DailyEntry[] }>();

    for (const entry of entries) {
        if (!groupsByDate.has(entry.date)) {
            groupsByDate.set(entry.date, { final: [], sub: [] });
        }
        const group = groupsByDate.get(entry.date)!;
        if (entry.entryType === EntryType.Final) {
            group.final.push(entry);
        } else {
            group.sub.push(entry);
        }
    }

    const effective: DailyEntry[] = [];
    for (const group of groupsByDate.values()) {
        if (group.final.length > 0) {
            effective.push(...group.final);
        } else if (group.sub.length > 0) {
            const latestSub = group.sub.sort((a, b) => b.time.localeCompare(a.time))[0];
            const campaignTotals = new Map<string, { adSpend: number; orders: number }>();

            for (const subEntry of group.sub) {
                for (const campaign of subEntry.campaigns) {
                    const current = campaignTotals.get(campaign.id) || { adSpend: 0, orders: 0 };
                    campaignTotals.set(campaign.id, {
                        adSpend: current.adSpend + campaign.adSpend,
                        orders: current.orders + campaign.orders
                    });
                }
            }
            
            const product = useStore.getState().products.find(p => p.id === latestSub.productId);

            const consolidatedEntry: DailyEntry = {
                ...latestSub,
                campaigns: product ? product.campaigns.map(pc => {
                    const data = campaignTotals.get(pc.id);
                    return {
                        id: pc.id,
                        name: pc.name,
                        adSpend: data?.adSpend || 0,
                        orders: data?.orders || 0,
                    };
                }).filter(c => c.adSpend > 0 || c.orders > 0) : [],
            };
            effective.push(consolidatedEntry);
        }
    }
    return effective;
};

export const useReportData = (config: ReportConfig | null): ReportData | null => {
    const { dailyEntries, products, settings } = useStore();

    return useMemo(() => {
        if (!config) return null;

        const productMap = new Map<string, Product>(products.map(p => [p.id, p]));

        const dateFilteredEntries = dailyEntries.filter(entry => {
            const entryDate = new Date(entry.date);
            const startDate = new Date(config.dateRange.start);
            startDate.setHours(0,0,0,0);
            const endDate = new Date(config.dateRange.end);
            endDate.setHours(23,59,59,999);
            return entryDate >= startDate && entryDate <= endDate;
        });

        const effectiveEntries = getEffectiveEntries(dateFilteredEntries);

        const filteredEntries = effectiveEntries.filter(entry => {
            if (config.productIds.length > 0 && !config.productIds.includes(entry.productId)) return false;
            if (config.source !== 'ALL' && entry.source !== config.source) return false;
            const product = productMap.get(entry.productId);
            if (!product) return false;
            // FIX: Correctly compare Season and SeasonFilter enums and include 'AllSeasons' products in filtered results.
            if (config.season !== SeasonFilter.All && product.season !== Season.AllSeasons && (product.season as string) !== (config.season as string)) return false;
            return true;
        });

        let totalSales = 0, totalCost = 0, totalAdSpend = 0, totalOrdersRaw = 0, totalUnitsSold = 0, totalOtherFixedCosts = 0;
        let totalEffectiveUnitsSold = 0;
        const salesByDate = new Map<string, number>();

        filteredEntries.forEach(entry => {
            const product = productMap.get(entry.productId);
            if (!product) return;

            const deliveryRate = (product.productDeliveryRate ?? settings.globalDeliveryRate) / 100;
            const effectiveUnitsSold = entry.totalUnitsSold * deliveryRate;
            totalEffectiveUnitsSold += effectiveUnitsSold;
            
            const revenue = effectiveUnitsSold * product.sellingPricePerUnit;
            const costOfGoods = effectiveUnitsSold * product.costPerUnit;
            const adSpend = entry.campaigns.reduce((sum, c) => sum + c.adSpend, 0) / settings.libyanDinarExchangeRate;
            const otherFixedCosts = effectiveUnitsSold * (product.otherFixedCostsPerUnit || 0);
            
            totalSales += revenue;
            totalCost += costOfGoods;
            totalAdSpend += adSpend;
            totalOtherFixedCosts += otherFixedCosts;
            totalOrdersRaw += entry.totalOrders;
            totalUnitsSold += entry.totalUnitsSold;

            const dateKey = entry.date;
            salesByDate.set(dateKey, (salesByDate.get(dateKey) || 0) + revenue);
        });
        
        const grossProfit = totalSales - totalCost - totalAdSpend - totalOtherFixedCosts;
        const effectiveOrders = totalOrdersRaw * (settings.globalDeliveryRate / 100);
        const cpo = effectiveOrders > 0 ? totalAdSpend / effectiveOrders : 0;
        const cps = totalEffectiveUnitsSold > 0 ? totalAdSpend / totalEffectiveUnitsSold : 0;
        const roas = totalAdSpend > 0 ? totalSales / totalAdSpend : 0;
        const totalInvestment = totalCost + totalAdSpend + totalOtherFixedCosts;
        const roi = totalInvestment > 0 ? (grossProfit / totalInvestment) * 100 : 0;
        const aov = effectiveOrders > 0 ? totalSales / effectiveOrders : 0;
        const upt = totalOrdersRaw > 0 ? totalUnitsSold / totalOrdersRaw : 0;

        const salesChartData = Array.from(salesByDate.entries())
            .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
            .map(([date, sales]) => ({ date, 'إجمالي المبيعات': sales }));

        const productProfitabilityData: ProfitabilityData[] = products
            .filter(p => config.productIds.length === 0 || config.productIds.includes(p.id))
            .map(product => {
                let pUnitsSold = 0, pTotalRevenue = 0, pTotalCost = 0, pTotalAdSpend = 0, pTotalOtherFixedCosts = 0;
                
                filteredEntries.filter(e => e.productId === product.id).forEach(entry => {
                    const deliveryRate = (product.productDeliveryRate ?? settings.globalDeliveryRate) / 100;
                    const effectiveUnitsSold = entry.totalUnitsSold * deliveryRate;
                    
                    pUnitsSold += entry.totalUnitsSold;
                    pTotalRevenue += effectiveUnitsSold * product.sellingPricePerUnit;
                    pTotalCost += effectiveUnitsSold * product.costPerUnit;
                    pTotalOtherFixedCosts += effectiveUnitsSold * (product.otherFixedCostsPerUnit || 0);
                    pTotalAdSpend += entry.campaigns.reduce((sum, c) => sum + c.adSpend, 0) / settings.libyanDinarExchangeRate;
                });
                
                const netProfit = pTotalRevenue - pTotalCost - pTotalAdSpend - pTotalOtherFixedCosts;
                const profitMargin = pTotalRevenue > 0 ? (netProfit / pTotalRevenue) * 100 : 0;

                return {
                    productId: product.id, productName: product.name, costPerUnit: product.costPerUnit,
                    unitsSold: pUnitsSold, totalRevenue: pTotalRevenue, totalCost: pTotalCost,
                    totalAdSpend: pTotalAdSpend, netProfit, profitMargin,
                };
            }).filter(d => d.unitsSold > 0);

        const campaignMap = new Map<string, any>();
        
        filteredEntries.forEach(entry => {
            const product = productMap.get(entry.productId);
            if (!product) return;
            const deliveryRate = (product.productDeliveryRate ?? settings.globalDeliveryRate) / 100;
            entry.campaigns.forEach(campaign => {
                if (!campaignMap.has(campaign.name)) {
                    campaignMap.set(campaign.name, { name: campaign.name, totalSales: 0, totalAdSpend: 0, totalOrders: 0, totalCost: 0, totalOtherFixedCosts: 0 });
                }
                const data = campaignMap.get(campaign.name)!;
                const effectiveOrders = campaign.orders * deliveryRate;
                const unitsSoldForCampaign = entry.totalOrders > 0 ? (campaign.orders / entry.totalOrders) * entry.totalUnitsSold * deliveryRate : 0;
                
                if (!isFinite(unitsSoldForCampaign)) return;
                
                data.totalSales += unitsSoldForCampaign * product.sellingPricePerUnit;
                data.totalCost += unitsSoldForCampaign * product.costPerUnit;
                data.totalAdSpend += campaign.adSpend / settings.libyanDinarExchangeRate;
                data.totalOtherFixedCosts += unitsSoldForCampaign * (product.otherFixedCostsPerUnit || 0);
                data.totalOrders += effectiveOrders;
            });
        });

        const campaignPerformanceData: CampaignPerformanceData[] = Array.from(campaignMap.values()).map(data => {
            const netProfit = data.totalSales - data.totalCost - data.totalAdSpend - data.totalOtherFixedCosts;
            const cpo = data.totalOrders > 0 ? data.totalAdSpend / data.totalOrders : 0;
            const roas = data.totalAdSpend > 0 ? data.totalSales / data.totalAdSpend : 0;
            const totalInvestment = data.totalCost + data.totalAdSpend + data.totalOtherFixedCosts;
            const roi = totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0;
            return { ...data, netProfit, cpo, roas, roi };
        });
        
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
            totalSales, grossProfit, totalOrders: Math.round(totalOrdersRaw), totalUnitsSold, cpo, cps, roas, roi, aov, upt,
            salesChartData, productProfitabilityData, campaignPerformanceData, orderDistributionData,
        };

    }, [config, dailyEntries, products, settings]);
};
