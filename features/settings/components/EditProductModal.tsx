import React, { useState, useEffect } from 'react';
import { Product, Season, Category, Gender } from '../../../shared/types/index';

interface EditProductModalProps {
    product: Product;
    categories: Category[];
    onClose: () => void;
    onSave: (updatedProduct: Product) => void;
}

const genderLabels: Record<Gender, string> = {
    [Gender.Women]: 'حريمي',
    [Gender.Men]: 'رجالي',
    [Gender.Kids]: 'أطفال',
};


const EditProductModal: React.FC<EditProductModalProps> = ({ product, categories, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        ...product,
        sellingPricePerUnit: String(product.sellingPricePerUnit),
        costPerUnit: String(product.costPerUnit),
        productDeliveryRate: product.productDeliveryRate != null ? String(product.productDeliveryRate) : '',
        otherFixedCostsPerUnit: product.otherFixedCostsPerUnit != null ? String(product.otherFixedCostsPerUnit) : '',
        sellingPrice1UnitOffer: product.sellingPrice1UnitOffer != null ? String(product.sellingPrice1UnitOffer) : '',
        sellingPrice2UnitsOffer: product.sellingPrice2UnitsOffer != null ? String(product.sellingPrice2UnitsOffer) : '',
        sellingPrice3UnitsOffer: product.sellingPrice3UnitsOffer != null ? String(product.sellingPrice3UnitsOffer) : '',
        maxCpo: product.maxCpo != null ? String(product.maxCpo) : '',
        initialStock: product.initialStock != null ? String(product.initialStock) : '',
        lowStockThreshold: product.lowStockThreshold != null ? String(product.lowStockThreshold) : '',
    });

    useEffect(() => {
         setFormData({
            ...product,
            sellingPricePerUnit: String(product.sellingPricePerUnit),
            costPerUnit: String(product.costPerUnit),
            productDeliveryRate: product.productDeliveryRate != null ? String(product.productDeliveryRate) : '',
            otherFixedCostsPerUnit: product.otherFixedCostsPerUnit != null ? String(product.otherFixedCostsPerUnit) : '',
            sellingPrice1UnitOffer: product.sellingPrice1UnitOffer != null ? String(product.sellingPrice1UnitOffer) : '',
            sellingPrice2UnitsOffer: product.sellingPrice2UnitsOffer != null ? String(product.sellingPrice2UnitsOffer) : '',
            sellingPrice3UnitsOffer: product.sellingPrice3UnitsOffer != null ? String(product.sellingPrice3UnitsOffer) : '',
            maxCpo: product.maxCpo != null ? String(product.maxCpo) : '',
            initialStock: product.initialStock != null ? String(product.initialStock) : '',
            lowStockThreshold: product.lowStockThreshold != null ? String(product.lowStockThreshold) : '',
        });
    }, [product]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const updatedProduct: Product = {
            ...product,
            name: formData.name,
            sellingPricePerUnit: parseFloat(formData.sellingPricePerUnit) || 0,
            costPerUnit: parseFloat(formData.costPerUnit) || 0,
            productDeliveryRate: formData.productDeliveryRate ? parseFloat(formData.productDeliveryRate) : undefined,
            otherFixedCostsPerUnit: formData.otherFixedCostsPerUnit ? parseFloat(formData.otherFixedCostsPerUnit) : undefined,
            sellingPrice1UnitOffer: formData.sellingPrice1UnitOffer ? parseFloat(formData.sellingPrice1UnitOffer) : undefined,
            sellingPrice2UnitsOffer: formData.sellingPrice2UnitsOffer ? parseFloat(formData.sellingPrice2UnitsOffer) : undefined,
            sellingPrice3UnitsOffer: formData.sellingPrice3UnitsOffer ? parseFloat(formData.sellingPrice3UnitsOffer) : undefined,
            season: formData.season,
            maxCpo: formData.maxCpo ? parseFloat(formData.maxCpo) : undefined,
            categoryId: formData.categoryId,
            gender: formData.gender,
            initialStock: formData.initialStock ? parseInt(formData.initialStock, 10) : undefined,
            lowStockThreshold: formData.lowStockThreshold ? parseInt(formData.lowStockThreshold, 10) : undefined,
        };

        onSave(updatedProduct);
        onClose();
    };

    const inputClasses = "w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-gray-900 focus:ring-orange-500 focus:border-orange-500 transition-colors";
    const labelClasses = "block text-sm font-medium text-gray-700 mb-2";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-900">تعديل المنتج: {product.name}</h2>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
                    <fieldset className="space-y-4">
                        <div>
                           <label htmlFor="name" className={labelClasses}>اسم المنتج</label>
                           <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className={inputClasses}/>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="categoryId" className={labelClasses}>الفئة</label>
                                <select name="categoryId" id="categoryId" value={formData.categoryId} onChange={handleChange} required className={inputClasses}>
                                    <option value="">اختر فئة...</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="gender" className={labelClasses}>الجنس</label>
                                <select name="gender" id="gender" value={formData.gender} onChange={handleChange} className={inputClasses}>
                                    {Object.values(Gender).map(g => <option key={g} value={g}>{genderLabels[g]}</option>)}
                                </select>
                            </div>
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="sellingPricePerUnit" className={labelClasses}>سعر البيع (د.ل)</label>
                                <input type="number" step="0.01" id="sellingPricePerUnit" name="sellingPricePerUnit" value={formData.sellingPricePerUnit} onChange={handleChange} required className={inputClasses}/>
                            </div>
                            <div>
                                <label htmlFor="costPerUnit" className={labelClasses}>التكلفة (د.ل)</label>
                                <input type="number" step="0.01" id="costPerUnit" name="costPerUnit" value={formData.costPerUnit} onChange={handleChange} required className={inputClasses}/>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="season" className={labelClasses}>الموسم</label>
                            <select name="season" id="season" value={formData.season} onChange={handleChange} className={inputClasses}>
                                <option value={Season.AllSeasons}>لكل الفصول</option>
                                <option value={Season.Summer}>صيفي</option>
                                <option value={Season.Winter}>شتوي</option>
                            </select>
                        </div>
                    </fieldset>
                    
                    <fieldset className="space-y-4 pt-4 border-t border-gray-200">
                        <legend className="text-sm font-semibold text-gray-600 mb-2">بيانات اختيارية</legend>
                         <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                             <div>
                                <label htmlFor="maxCpo" className={labelClasses}>أقصى CPO</label>
                                <input type="number" step="0.01" id="maxCpo" name="maxCpo" value={formData.maxCpo} onChange={handleChange} className={inputClasses}/>
                            </div>
                            <div>
                                <label htmlFor="productDeliveryRate" className={labelClasses}>نسبة تسليم خاصة (%)</label>
                                <input type="number" step="0.1" id="productDeliveryRate" name="productDeliveryRate" value={formData.productDeliveryRate} onChange={handleChange} className={inputClasses}/>
                            </div>
                             <div>
                                <label htmlFor="otherFixedCostsPerUnit" className={labelClasses}>تكاليف ثابتة أخرى (للقطعة)</label>
                                <input type="number" step="0.01" id="otherFixedCostsPerUnit" name="otherFixedCostsPerUnit" value={formData.otherFixedCostsPerUnit} onChange={handleChange} className={inputClasses}/>
                            </div>
                         </div>
                         <div className="grid grid-cols-2 gap-4 pt-4 border-t mt-4">
                             <div>
                                <label htmlFor="initialStock" className={labelClasses}>الكمية الأولية بالمخزون</label>
                                <input type="number" id="initialStock" name="initialStock" value={formData.initialStock} onChange={handleChange} className={inputClasses}/>
                            </div>
                            <div>
                                <label htmlFor="lowStockThreshold" className={labelClasses}>حد تنبيه انخفاض المخزون</label>
                                <input type="number" id="lowStockThreshold" name="lowStockThreshold" value={formData.lowStockThreshold} onChange={handleChange} className={inputClasses}/>
                            </div>
                         </div>
                         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t mt-4">
                            <div>
                                <label htmlFor="sellingPrice1UnitOffer" className={labelClasses}>عرض قطعة (د.ل)</label>
                                <input type="number" step="0.01" id="sellingPrice1UnitOffer" name="sellingPrice1UnitOffer" value={formData.sellingPrice1UnitOffer} onChange={handleChange} className={inputClasses}/>
                            </div>
                             <div>
                                <label htmlFor="sellingPrice2UnitsOffer" className={labelClasses}>عرض قطعتين (د.ل)</label>
                                <input type="number" step="0.01" id="sellingPrice2UnitsOffer" name="sellingPrice2UnitsOffer" value={formData.sellingPrice2UnitsOffer} onChange={handleChange} className={inputClasses}/>
                            </div>
                             <div>
                                <label htmlFor="sellingPrice3UnitsOffer" className={labelClasses}>عرض 3 قطع (د.ل)</label>
                                <input type="number" step="0.01" id="sellingPrice3UnitsOffer" name="sellingPrice3UnitsOffer" value={formData.sellingPrice3UnitsOffer} onChange={handleChange} className={inputClasses}/>
                            </div>
                         </div>
                    </fieldset>

                    <div className="flex justify-end gap-4 pt-6 border-t">
                        <button type="button" onClick={onClose} className="bg-gray-100 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-200">إلغاء</button>
                        <button type="submit" className="bg-orange-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-orange-600">حفظ التغييرات</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditProductModal;