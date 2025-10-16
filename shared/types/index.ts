export enum Page {
  Dashboard = 'DASHBOARD',
  DailyEntry = 'DAILY_ENTRY',
  Settings = 'SETTINGS',
  Reports = 'REPORTS',
}

export enum TimeFilter {
  All = 'ALL',
  Today = 'TODAY',
  Week = 'WEEK',
  Month = 'MONTH',
  Quarter = 'QUARTER',
  Year = 'YEAR',
  Custom = 'CUSTOM',
}

export enum ComparisonTimeFilter {
  None = 'NONE',
  PreviousPeriod = 'PREVIOUS_PERIOD',
  PreviousYear = 'PREVIOUS_YEAR',
}

export enum SourceFilter {
  All = 'ALL',
  Website = 'WEBSITE',
  Page = 'PAGE',
}

export enum Season {
  Summer = 'SUMMER',
  Winter = 'WINTER',
  AllSeasons = 'ALL_SEASONS',
}

export enum SeasonFilter {
  All = 'ALL',
  Summer = 'SUMMER',
  Winter = 'WINTER',
}

export enum Gender {
  Women = 'WOMEN',
  Men = 'MEN',
  Kids = 'KIDS',
}

export enum EntryType {
    Sub = 'SUB',
    Final = 'FINAL',
}

export interface Category {
  id: string;
  name: string;
}

export interface Campaign {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  sellingPricePerUnit: number;
  costPerUnit: number;
  productDeliveryRate?: number;
  otherFixedCostsPerUnit?: number;
  sellingPrice1UnitOffer?: number;
  sellingPrice2UnitsOffer?: number;
  sellingPrice3UnitsOffer?: number;
  season: Season;
  maxCpo?: number;
  categoryId: string;
  gender: Gender;
  campaigns: Campaign[];
  initialStock?: number;
  lowStockThreshold?: number;
}

export interface CampaignEntry {
  id: string;
  name: string;
  adSpend: number; // In EGP
  orders: number;
}

export interface FormCampaignData {
    id: string;
    name: string;
    adSpend: string;
    orders: string;
}

export interface DailyEntry {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  entryType: EntryType;
  productId: string;
  source: SourceFilter.Website | SourceFilter.Page;
  totalUnitsSold: number;
  totalOrders: number;
  campaigns: CampaignEntry[];
}

export interface Settings {
  globalDeliveryRate: number;
  libyanDinarExchangeRate: number;
  orderDistribution1Unit: number;
  orderDistribution2Units: number;
  orderDistribution3Units: number;
  orderDistributionMoreThan3Units: number;
  monthlyTargetRevenue: number;
  monthlyTargetUnitsSold: number;
  monthlyTargetOrders: number;
}

export interface CustomDateRange {
  start: string;
  end: string;
}

export interface CampaignPerformanceData {
  name: string;
  totalSales: number;
  totalAdSpend: number;
  totalOrders: number;
  totalCost: number;
  netProfit: number;
  roi: number;
  roas: number;
  cpo: number;
}

export enum ReportSection {
  KPISummary = 'KPI_SUMMARY',
  SalesChart = 'SALES_CHART',
  ProductProfitability = 'PRODUCT_PROFITABILITY',
  CampaignPerformance = 'CAMPAIGN_PERFORMANCE',
  OrderDistribution = 'ORDER_DISTRIBUTION',
}

export interface ReportConfig {
  dateRange: {
    start: string;
    end: string;
  };
  productIds: string[]; // empty array means 'ALL'
  source: SourceFilter;
  season: SeasonFilter;
  sections: ReportSection[];
}

export interface CPOAlert {
    date: string;
    productName: string;
    campaignName: string;
    cpo: number;
    maxCpo: number;
}

export interface ProfitabilityData {
    productId: string;
    productName: string;
    costPerUnit: number;
    unitsSold: number;
    totalRevenue: number;
    totalCost: number;
    totalAdSpend: number;
    netProfit: number;
    profitMargin: number;
}

export interface ReportData {
  totalSales: number;
  grossProfit: number;
  totalOrders: number;
  totalUnitsSold: number;
  cpo: number;
  cps: number;
  roas: number;
  roi: number;
  aov: number;
  upt: number;
  salesChartData: { date: string; 'إجمالي المبيعات': number }[];
  productProfitabilityData: ProfitabilityData[];
  campaignPerformanceData: CampaignPerformanceData[];
  orderDistributionData: { name: string; value: number; fill: string }[];
}

export interface StockAlert {
  productId: string;
  productName: string;
  currentStock: number;
  lowStockThreshold: number;
}

export interface SpendVsRevenueShareData {
    productName: string;
    delta: number;
}
