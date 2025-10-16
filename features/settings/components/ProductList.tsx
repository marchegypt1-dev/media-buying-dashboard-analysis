import React, { useState } from 'react';
import { Product, Category, Gender } from '../../../shared/types';
import { TrashIcon, PencilIcon, CubeIcon } from '../../../shared/components/Icons';

interface ProductListProps {
    products: Product[];
    deleteProduct: (id: string) => void;
    setEditingProduct: (product: Product) => void;
    categories: Category[];
}

const genderLabels: Record<Gender, string> = {
    [Gender.Women]: 'حريمي',
    [Gender.Men]: 'رجالي',
    [Gender.Kids]: 'أطفال',
};

const ProductList: React.FC<ProductListProps> = ({ products, deleteProduct, setEditingProduct, categories }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const getCategoryName = (categoryId: string) => {
        return categories.find(c => c.id === categoryId)?.name || 'N/A';
    };

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return (
        <div className="bg-white p-8 rounded-2xl border border-gray-200/80 shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">قائمة المنتجات ({filteredProducts.length})</h2>
                <input 
                    type="text"
                    placeholder="ابحث عن منتج..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-64 bg-gray-50 border border-gray-300 rounded-lg p-2 text-sm text-gray-900 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                />
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-600">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 font-medium tracking-wider">اسم المنتج</th>
                            <th className="px-4 py-3 font-medium tracking-wider">الفئة</th>
                            <th className="px-4 py-3 font-medium tracking-wider">الجنس</th>
                            <th className="px-4 py-3 font-medium tracking-wider">سعر البيع</th>
                            <th className="px-4 py-3 font-medium tracking-wider">التكلفة</th>
                            <th className="px-4 py-3 font-medium tracking-wider"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {filteredProducts.length > 0 ? filteredProducts.map(product => (
                            <tr key={product.id} className="group hover:bg-gray-50 transition-colors duration-200">
                                <td className="px-4 py-4 font-semibold text-gray-900 whitespace-nowrap">{product.name}</td>
                                <td className="px-4 py-4">{getCategoryName(product.categoryId)}</td>
                                <td className="px-4 py-4">{genderLabels[product.gender]}</td>
                                <td className="px-4 py-4 font-medium text-gray-800">{product.sellingPricePerUnit.toFixed(2)} د.ل</td>
                                <td className="px-4 py-4 font-medium text-gray-800">{product.costPerUnit.toFixed(2)} د.ل</td>
                                <td className="px-4 py-4 text-right">
                                    <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => setEditingProduct(product)} className="text-gray-400 hover:text-blue-500 transition-colors p-1.5 rounded-full">
                                            <PencilIcon className="w-4 h-4"/>
                                        </button>
                                        <button onClick={() => deleteProduct(product.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded-full">
                                            <TrashIcon className="w-4 h-4"/>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={6} className="text-center py-16 text-gray-500">
                                    <div className="flex flex-col items-center">
                                        <CubeIcon className="w-10 h-10 text-gray-400 mb-3"/>
                                        <span className="font-medium">
                                            {products.length === 0 ? "لم تقم بإضافة أي منتجات بعد." : "لا توجد منتجات تطابق بحثك."}
                                        </span>
                                        {products.length === 0 && <span className="text-xs mt-1">ابدأ بإضافة منتج جديد من النموذج الموجود على اليسار.</span>}
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ProductList;
