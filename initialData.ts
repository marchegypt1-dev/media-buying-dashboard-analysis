import { Product, DailyEntry, Settings, Category } from './shared/types/index';

// Initial Categories are now empty, user will add them manually
export const initialCategories: Category[] = [];

// Initial Products are now empty, user will add them manually
export const initialProducts: Product[] = [];

// Initial Daily Entries are now empty, user will add them manually
export const initialDailyEntries: DailyEntry[] = [];

// Initial Settings remain to provide sensible defaults
export const initialSettings: Settings = {
    globalDeliveryRate: 90, // percentage
    libyanDinarExchangeRate: 6.5, // 1 LYD = X EGP
    orderDistribution1Unit: 58.6,
    orderDistribution2Units: 30.4,
    orderDistribution3Units: 8.5,
    orderDistributionMoreThan3Units: 2.5,
    monthlyTargetRevenue: 50000,
    monthlyTargetUnitsSold: 400,
    monthlyTargetOrders: 350,
};
