import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Product, DailyEntry, Settings, Category, Campaign } from '../types';
import { initialProducts, initialDailyEntries, initialSettings, initialCategories } from '../../initialData';
import toast from 'react-hot-toast';

export interface AppState {
    products: Product[];
    dailyEntries: DailyEntry[];
    settings: Settings;
    categories: Category[];
    editingProduct: Product | null;
    
    // Actions
    addProduct: (product: Omit<Product, 'id' | 'campaigns'>) => void;
    addMultipleProducts: (productsToAdd: Omit<Product, 'id' | 'campaigns'>[]) => void;
    updateProduct: (updatedProduct: Product) => void;
    deleteProduct: (id: string) => void;
    addProductCampaign: (productId: string, campaignName: string) => void;
    addCategory: (name: string) => void;
    deleteCategory: (id: string) => void;
    addDailyEntry: (entry: Omit<DailyEntry, 'id'>) => void;
    addMultipleDailyEntries: (entries: Omit<DailyEntry, 'id'>[]) => void;
    updateDailyEntry: (updatedEntry: DailyEntry) => void;
    deleteDailyEntry: (id: string) => void;
    setSettings: (settings: Settings) => void;
    setEditingProduct: (product: Product | null) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
        products: initialProducts,
        dailyEntries: initialDailyEntries,
        settings: initialSettings,
        categories: initialCategories,
        editingProduct: null,

        // Product Management
        addProduct: (product) => {
            const newProduct: Product = { ...product, id: crypto.randomUUID(), campaigns: [] };
            set(state => ({ products: [...state.products, newProduct] }));
        },
        addMultipleProducts: (productsToAdd) => {
            const newProducts: Product[] = productsToAdd.map(p => ({ ...p, id: crypto.randomUUID(), campaigns: [] }));
            set(state => ({ products: [...state.products, ...newProducts] }));
        },
        updateProduct: (updatedProduct) => {
            set(state => ({
                products: state.products.map(p => p.id === updatedProduct.id ? updatedProduct : p)
            }));
        },
        deleteProduct: (id) => {
            if (window.confirm('Are you sure you want to delete this product? This will also delete all associated daily entries.')) {
                set(state => ({
                    products: state.products.filter(p => p.id !== id),
                    dailyEntries: state.dailyEntries.filter(entry => entry.productId !== id)
                }));
                toast.success('Product and associated entries deleted.');
            }
        },
        addProductCampaign: (productId, campaignName) => {
            const products = get().products;
            const product = products.find(p => p.id === productId);
            if (!product) {
                toast.error("Product not found.");
                return;
            }
            if (product.campaigns.some(c => c.name.toLowerCase() === campaignName.toLowerCase())) {
                toast.error("Campaign with this name already exists for this product.");
                return;
            }

            set(state => ({
                products: state.products.map(p => {
                    if (p.id === productId) {
                        const newCampaign: Campaign = { id: crypto.randomUUID(), name: campaignName };
                        return { ...p, campaigns: [...p.campaigns, newCampaign] };
                    }
                    return p;
                })
            }));
            toast.success(`Campaign '${campaignName}' added to '${product.name}'.`);
        },
        
        // Category Management
        addCategory: (name) => {
             if (get().categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
                toast.error("Category with this name already exists.");
                return;
            }
            const newCategory: Category = { id: crypto.randomUUID(), name };
            set(state => ({ categories: [...state.categories, newCategory] }));
            toast.success(`Category '${name}' added.`);
        },
        deleteCategory: (id) => {
             if (get().products.some(p => p.categoryId === id)) {
                toast.error("Cannot delete category as it is being used by one or more products.");
                return;
            }
            if (window.confirm('Are you sure you want to delete this category?')) {
                set(state => ({ categories: state.categories.filter(c => c.id !== id) }));
                toast.success('Category deleted.');
            }
        },

        // Daily Entry Management
        addDailyEntry: (entry) => {
            const newEntry: DailyEntry = { ...entry, id: crypto.randomUUID() };
            set(state => ({ dailyEntries: [newEntry, ...state.dailyEntries] }));
        },
        addMultipleDailyEntries: (entries) => {
            const newEntries: DailyEntry[] = entries.map(entry => ({ ...entry, id: crypto.randomUUID() }));
            set(state => ({ dailyEntries: [...newEntries, ...state.dailyEntries] }));
        },
        updateDailyEntry: (updatedEntry) => {
            set(state => ({
                dailyEntries: state.dailyEntries.map(e => e.id === updatedEntry.id ? updatedEntry : e)
            }));
        },
        deleteDailyEntry: (id) => {
            if (window.confirm('Are you sure you want to delete this entry?')) {
                set(state => ({ dailyEntries: state.dailyEntries.filter(e => e.id !== id) }));
                toast.success('Entry deleted.');
            }
        },
        
        // Settings
        setSettings: (newSettings) => set({ settings: newSettings }),

        // Editing State
        setEditingProduct: (product) => set({ editingProduct: product }),
    }),
    {
      name: 'kpi-dashboard-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);