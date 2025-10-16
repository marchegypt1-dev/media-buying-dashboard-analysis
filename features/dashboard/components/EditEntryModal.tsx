import React, { useState, useMemo, useEffect } from 'react';
import { DailyEntry, Product, SourceFilter, CampaignEntry, EntryType, FormCampaignData } from '../../../shared/types/index';

interface EditEntryModalProps {
    entry: DailyEntry;
    products: Product[];
    onClose: () => void;
    onSave: (updatedEntry: DailyEntry) => void;
}

const EditEntryModal: React.FC<EditEntryModalProps> = ({ entry, products, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        ...entry,
        totalUnitsSold: String(entry.totalUnitsSold),
        totalOrders: String(entry.totalOrders),
        campaigns: entry.campaigns.map(c => ({
            ...c,
            adSpend: String(c.adSpend),
            orders: String(c.orders)
        })) as FormCampaignData[]
    });

    const selectedProduct = useMemo(() => products.find(p => p.id === formData.productId), [products, formData.productId]);

    const campaignOrdersSum = useMemo(() => {
        return formData.campaigns.reduce((sum, camp) => sum + (parseInt(camp.orders, 10) || 0), 0);
    }, [formData.campaigns]);

    const ordersDiscrepancy = useMemo(() => {
        const manualTotal = parseInt(formData.totalOrders, 10) || 0;
        if (manualTotal === 0) return null;
        const difference = manualTotal - campaignOrdersSum;
        const percentage = (difference / manualTotal) * 100;
        return { difference, percentage };
    }, [formData.totalOrders, campaignOrdersSum]);

    useEffect(() => {
        if (selectedProduct) {
            const existingCampaigns = new Map(formData.campaigns.map(c => [c.id, c]));
            const productCampaigns = selectedProduct.campaigns.map(productCampaign => {
                const existingData = existingCampaigns.get(productCampaign.id);
                return existingData || {
                    id: productCampaign.id,
                    name: productCampaign.name,
                    adSpend: '0',
                    orders: '0'
                };
            });
            setFormData(prev => ({ ...prev, campaigns: productCampaigns }));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedProduct, entry.id]); // Depends on entry.id to re-sync when modal opens for a new entry

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCampaignChange = (index: number, field: 'adSpend' | 'orders', value: string) => {
        const newCampaigns = [...formData.campaigns];
        newCampaigns[index][field] = value;
        setFormData(prev => ({ ...prev, campaigns: newCampaigns }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const totalOrders = parseInt(formData.totalOrders, 10) || 0;

        const processedCampaigns: CampaignEntry[] = formData.campaigns
            .map(c => ({
                id: c.id,
                name: c.name,
                adSpend: parseFloat(c.adSpend) || 0,
                orders: parseInt(c.orders, 10) || 0,
            }))
            .filter(c => c.adSpend > 0 || c.orders > 0);

        const updatedEntry: DailyEntry = {
            ...entry,
            date: formData.date,
            time: formData.time,
            entryType: formData.entryType,
            source: formData.source,
            totalUnitsSold: parseFloat(formData.totalUnitsSold) || 0,
            totalOrders: totalOrders,
            campaigns: processedCampaigns
        };
        
        onSave(updatedEntry);
    };
    
    const inputClasses = "w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-gray-900 focus:ring-orange-500 focus:border-orange-500 transition-colors";
    const labelClasses = "block text-sm font-medium text-gray-700 mb-2";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-900">تعديل الإدخال</h2>
                    <p className="text-sm text-gray-500 mt-1">تعديل بيانات {selectedProduct?.name} بتاريخ {entry.date}</p>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
                    <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="date" className={labelClasses}>التاريخ</label>
                            <input type="date" name="date" value={formData.date} onChange={handleInputChange} className={inputClasses} required/>
                        </div>
                        <div>
                            <label htmlFor="time" className={labelClasses}>الوقت</label>
                            <input type="time" name="time" value={formData.time} onChange={handleInputChange} className={inputClasses} required/>
                        </div>
                    </fieldset>
                    
                    <fieldset className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className={labelClasses}>المنتج</label>
                            <input type="text" value={selectedProduct?.name || ''} className={`${inputClasses} bg-gray-200 cursor-not-allowed`} disabled/>
                        </div>
                        <div>
                            <label htmlFor="source" className={labelClasses}>المصدر</label>
                            <select name="source" value={formData.source} onChange={handleInputChange} className={inputClasses} required>
                                <option value={SourceFilter.Website}>الموقع الإلكتروني</option>
                                <option value={SourceFilter.Page}>بيدج</option>
                            </select>
                        </div>
                         <div>
                            <label htmlFor="entryType" className={labelClasses}>نوع الإدخال</label>
                             <select name="entryType" value={formData.entryType} onChange={handleInputChange} className={inputClasses} required>
                                <option value={EntryType.Sub}>تقفيل فرعي</option>
                                <option value={EntryType.Final}>التقفيل الأساسي</option>
                            </select>
                        </div>
                    </fieldset>

                    <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
                        <div>
                            <label htmlFor="totalUnitsSold" className={labelClasses}>إجمالي القطع المباعة</label>
                            <input type="number" name="totalUnitsSold" value={formData.totalUnitsSold} onChange={handleInputChange} className={inputClasses} placeholder="0" required/>
                        </div>
                         <div>
                            <div className="flex justify-between items-baseline">
                               <label htmlFor="totalOrders" className={labelClasses}>إجمالي الأوردرات</label>
                                {ordersDiscrepancy && (
                                    <span className={`text-xs font-bold ${ordersDiscrepancy.difference !== 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                                        فرق: {ordersDiscrepancy.difference > 0 ? '+' : ''}{ordersDiscrepancy.difference} ({ordersDiscrepancy.percentage.toFixed(1)}%)
                                    </span>
                                )}
                           </div>
                            <input type="number" name="totalOrders" value={formData.totalOrders} onChange={handleInputChange} required className={inputClasses}/>
                        </div>
                    </fieldset>

                    <fieldset>
                        <legend className="text-md font-semibold text-gray-800 mb-4">بيانات الحملات</legend>
                        <div className="space-y-4">
                            {formData.campaigns.map((campaign, index) => (
                                <div key={campaign.id} className="flex flex-col md:flex-row gap-4 items-end p-4 bg-gray-50 rounded-lg border">
                                    <div className="flex-grow w-full md:w-auto">
                                        <label className="text-xs font-medium text-gray-600">اسم الحملة</label>
                                        <input type="text" value={campaign.name} readOnly className={`${inputClasses} mt-1 bg-gray-200 cursor-not-allowed`} />
                                    </div>
                                    <div className="flex-shrink-0 w-full md:w-40">
                                        <label className="text-xs font-medium text-gray-600">المصروف (ج.م)</label>
                                        <input type="number" step="0.01" value={campaign.adSpend} onChange={(e) => handleCampaignChange(index, 'adSpend', e.target.value)} className={`${inputClasses} mt-1`} />
                                    </div>
                                    <div className="flex-shrink-0 w-full md:w-32">
                                        <label className="text-xs font-medium text-gray-600">الأوردرات</label>
                                        <input type="number" value={campaign.orders} onChange={(e) => handleCampaignChange(index, 'orders', e.target.value)} className={`${inputClasses} mt-1`} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </fieldset>

                    <div className="flex justify-end gap-4 pt-6 border-t">
                        <button type="button" onClick={onClose} className="bg-gray-100 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-200">
                            إلغاء
                        </button>
                        <button type="submit" className="bg-orange-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-orange-600">
                            حفظ التغييرات
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditEntryModal;