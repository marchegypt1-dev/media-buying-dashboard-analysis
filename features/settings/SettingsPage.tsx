import React from 'react';
import GeneralSettings from './components/GeneralSettings';
import ProductList from './components/ProductList';
import AddProduct from './components/AddProduct';
import CategoryManager from './components/CategoryManager';
import EditProductModal from './components/EditProductModal';
import { useStore } from '../../shared/store/useStore';

const SettingsPage: React.FC = () => {
    const {
        settings, setSettings, products, addProduct, addMultipleProducts,
        updateProduct, deleteProduct, categories, addCategory, deleteCategory,
        editingProduct, setEditingProduct
    } = useStore();

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-900">الإعدادات والمنتجات</h1>
            
            <GeneralSettings settings={settings} setSettings={setSettings} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-1 space-y-8">
                    <CategoryManager 
                        categories={categories}
                        addCategory={addCategory}
                        deleteCategory={deleteCategory}
                    />
                    <AddProduct 
                        addProduct={addProduct}
                        addMultipleProducts={addMultipleProducts}
                        categories={categories}
                    />
                </div>
                <div className="lg:col-span-2">
                    <ProductList 
                        products={products}
                        deleteProduct={deleteProduct}
                        setEditingProduct={setEditingProduct}
                        categories={categories}
                    />
                </div>
            </div>
            {editingProduct && (
                <EditProductModal
                    product={editingProduct}
                    categories={categories}
                    onClose={() => setEditingProduct(null)}
                    onSave={(updated) => {
                        updateProduct(updated);
                        setEditingProduct(null);
                    }}
                />
            )}
        </div>
    );
};

export default SettingsPage;
