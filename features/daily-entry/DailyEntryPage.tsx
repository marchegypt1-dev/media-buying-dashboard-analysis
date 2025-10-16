import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { DailyEntry, EntryType, SourceFilter, FormCampaignData, Campaign, Product } from '../../shared/types';
import { CubeIcon, PlusIcon, CloudArrowUpIcon, DocumentArrowDownIcon, ExclamationTriangleIcon, CheckCircleIcon } from '../../shared/components/Icons';
import { useStore } from '../../shared/store/useStore';
import toast from 'react-hot-toast';

const getInitialState = () => ({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().split(' ')[0].substring(0, 5),
    entryType: EntryType.Sub,
    productId: '',
    source: SourceFilter.Website,
    totalUnitsSold: '',
    totalOrders: '',
});

const DailyEntryPage: React.FC = () => {
    const { products, addDailyEntry, addMultipleDailyEntries, addProductCampaign } = useStore(state => ({
        products: state.products,
        addDailyEntry: state.addDailyEntry,
        addMultipleDailyEntries: state.addMultipleDailyEntries,
        addProductCampaign: state.addProductCampaign,
    }));

    const [formData, setFormData] = useState(getInitialState());
    const [campaigns, setCampaigns] = useState<FormCampaignData[]>([]);
    const [newCampaignName, setNewCampaignName] = useState('');
    const [entryMode, setEntryMode] = useState<'manual' | 'bulk'>('manual');
    
    // State for bulk upload
    const [parsedEntries, setParsedEntries] = useState<Omit<DailyEntry, 'id'>[]>([]);
    const [parsingErrors, setParsingErrors] = useState<{ row: number; message: string; }[]>([]);
    const [fileProcessed, setFileProcessed] = useState<boolean>(false);


    const selectedProduct = useMemo(() => {
        return products.find(p => p.id === formData.productId);
    }, [products, formData.productId]);

    useEffect(() => {
        if (selectedProduct) {
            const currentCampaignsData = new Map(campaigns.map(c => [c.id, c]));
            const newCampaignsState = selectedProduct.campaigns.map(productCampaign => {
                const existingFormData = currentCampaignsData.get(productCampaign.id);
                return existingFormData || { ...productCampaign, adSpend: '', orders: '' };
            });
            setCampaigns(newCampaignsState);
        } else {
            setCampaigns([]);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedProduct]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'productId') {
            const product = products.find(p => p.id === value);
            setCampaigns(product ? product.campaigns.map(c => ({...c, adSpend: '', orders: ''})) : []);
        }
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCampaignChange = (index: number, field: 'adSpend' | 'orders', value: string) => {
        const newCampaigns = [...campaigns];
        newCampaigns[index][field] = value;
        setCampaigns(newCampaigns);
    };

    const handleAddCampaign = () => {
        if (!newCampaignName.trim() || !selectedProduct) {
            toast.error("Please enter a campaign name and select a product first.");
            return;
        }
        addProductCampaign(selectedProduct.id, newCampaignName.trim());
        setNewCampaignName('');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.productId) {
            toast.error("Please select a product.");
            return;
        }

        const entryData: Omit<DailyEntry, 'id'> = {
            date: formData.date,
            time: formData.time,
            entryType: formData.entryType,
            productId: formData.productId,
            source: formData.source as SourceFilter.Website | SourceFilter.Page,
            totalUnitsSold: parseInt(formData.totalUnitsSold, 10) || 0,
            totalOrders: parseInt(formData.totalOrders, 10) || 0,
            campaigns: campaigns
                .map(c => ({
                    id: c.id,
                    name: c.name,
                    adSpend: parseFloat(c.adSpend) || 0,
                    orders: parseInt(c.orders, 10) || 0,
                }))
                .filter(c => c.adSpend > 0 || c.orders > 0)
        };
        addDailyEntry(entryData);
        toast.success('Daily entry added successfully!');
        setFormData(prev => ({
            ...getInitialState(),
            date: prev.date,
            time: new Date().toTimeString().split(' ')[0].substring(0, 5),
        }));
        setCampaigns([]);
    };

    const campaignOrdersSum = useMemo(() => {
        return campaigns.reduce((sum, camp) => sum + (parseInt(camp.orders, 10) || 0), 0);
    }, [campaigns]);

    const ordersDiscrepancy = useMemo(() => {
        const manualTotal = parseInt(formData.totalOrders, 10) || 0;
        if (manualTotal === 0 && campaignOrdersSum === 0) return null;
        const difference = manualTotal - campaignOrdersSum;
        const percentage = manualTotal > 0 ? (difference / manualTotal) * 100 : 0;
        return { difference, percentage };
    }, [formData.totalOrders, campaignOrdersSum]);

    // --- Bulk Upload Functions ---
    const downloadDailyEntryTemplate = useCallback(() => {
        const header = "date,time,entryType,productName,source,totalUnitsSold,totalOrders,campaignName,adSpend(EGP),orders\n";
        
        const csvRows: string[] = [];
        const today = new Date().toISOString().split('T')[0];

        products.forEach(product => {
            if (product.campaigns.length > 0) {
                product.campaigns.forEach(campaign => {
                    const row = [today, '12:00', 'SUB', product.name, 'WEBSITE', '', '', campaign.name, '', ''].join(',');
                    csvRows.push(row);
                });
            } else {
                 const row = [today, '12:00', 'SUB', product.name, 'WEBSITE', '', '', 'لا توجد حملات - أضف واحدة أولاً', '', ''].join(',');
                csvRows.push(row);
            }
        });

        const bom = "\uFEFF";
        const content = bom + header + csvRows.join('\n');
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "daily_entries_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [products]);

    const handleClearImport = () => {
        setParsedEntries([]);
        setParsingErrors([]);
        setFileProcessed(false);
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };
    
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        handleClearImport();

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            if (!text) {
                setParsingErrors([{ row: 1, message: "Could not read file content." }]);
                setFileProcessed(true); return;
            }
            
            const lines = text.split(/\r\n|[\n\r]/).filter(line => line.trim() !== '');
            if (lines.length < 2) {
                setParsingErrors([{ row: 1, message: "File is empty or contains only a header." }]);
                setFileProcessed(true); return;
            }

            const headerLine = lines[0].replace(/^\uFEFF/, '').trim();
            const commaCount = (headerLine.match(/,/g) || []).length;
            const semicolonCount = (headerLine.match(/;/g) || []).length;
            const tabCount = (headerLine.match(/\t/g) || []).length;
            let delimiter = ',';
            if (semicolonCount > commaCount && semicolonCount > tabCount) delimiter = ';';
            else if (tabCount > commaCount && tabCount > semicolonCount) delimiter = '\t';

            const header = headerLine.split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));
            const requiredHeaders = ['date', 'productName', 'source', 'totalUnitsSold', 'totalOrders', 'campaignName', 'adSpend(EGP)', 'orders'];
            
            const lowercasedFileHeaders = header.map(h => h.toLowerCase());
            const missingHeaders = requiredHeaders.filter(rh => !lowercasedFileHeaders.includes(rh.toLowerCase()));

            if (missingHeaders.length > 0) {
                setParsingErrors([{ row: 1, message: `File is missing required headers: ${missingHeaders.join(', ')}` }]);
                setFileProcessed(true); return;
            }

            const headerMapping: { [key: string]: string } = {};
            requiredHeaders.concat(['time', 'entryType']).forEach(rh => {
                const actualHeader = header.find(h => h.toLowerCase() === rh.toLowerCase());
                if (actualHeader) headerMapping[rh] = actualHeader;
            });

            type RawRow = { [key: string]: string | number } & { rowNumber: number, productId: string, campaignId: string, campaignName: string };
            const validRawData: RawRow[] = [];
            const localErrors: { row: number; message: string; }[] = [];
            const productMap = new Map(products.map(p => [p.name.toLowerCase(), p]));

            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(delimiter).map(v => v.trim().replace(/^"|"$/g, ''));
                const rowNumber = i + 1;
                if (values.every(v => v === '')) continue;

                const rowData: { [key: string]: string } = {};
                header.forEach((key, index) => { rowData[key] = values[index] || ''; });

                const rowErrors: string[] = [];
                const productNameVal = rowData[headerMapping.productName];
                const campaignNameVal = rowData[headerMapping.campaignName];

                if (!/^\d{4}-\d{2}-\d{2}$/.test(rowData[headerMapping.date])) rowErrors.push("Invalid date format (YYYY-MM-DD).");

                const product = productMap.get(productNameVal?.toLowerCase()) as Product | undefined;
                let campaign: Campaign | undefined;

                if (product) {
                    campaign = product.campaigns.find(c => c.name.toLowerCase() === campaignNameVal?.toLowerCase());
                    if (!campaign) {
                        rowErrors.push(`Campaign '${campaignNameVal}' not found for product '${product.name}'.`);
                    }
                } else {
                    rowErrors.push(`Product '${productNameVal}' not found.`);
                }

                if (rowData[headerMapping.source]?.toUpperCase() !== SourceFilter.Website && rowData[headerMapping.source]?.toUpperCase() !== SourceFilter.Page) rowErrors.push("Source must be 'WEBSITE' or 'PAGE'.");
                
                requiredHeaders.slice(3).forEach(field => {
                    if (rowData[headerMapping[field]] && isNaN(parseFloat(rowData[headerMapping[field]]))) rowErrors.push(`'${field}' must be a number.`);
                });

                if (rowErrors.length > 0) {
                    localErrors.push({ row: rowNumber, message: rowErrors.join(' | ') });
                } else if (product && campaign) {
                    const mappedRowData: { [key: string]: string } = {};
                    Object.keys(headerMapping).forEach(key => { mappedRowData[key] = rowData[headerMapping[key]]; });
                    validRawData.push({ ...mappedRowData, rowNumber, productId: product.id, campaignId: campaign.id, campaignName: campaign.name });
                }
            }

            if (localErrors.length === 0) {
                const entryMap = new Map<string, Omit<DailyEntry, 'id'>>();
                validRawData.forEach(row => {
                    const key = `${row.date}-${row.time}-${row.productId}`;
                    if (!entryMap.has(key)) {
                        entryMap.set(key, {
                            date: row.date as string, time: (row.time as string) || '00:00',
                            entryType: ((row.entryType as string)?.toUpperCase() as EntryType) || EntryType.Sub,
                            productId: row.productId, source: (row.source as string).toUpperCase() as SourceFilter.Website | SourceFilter.Page,
                            totalUnitsSold: parseInt(row.totalUnitsSold as string, 10) || 0,
                            totalOrders: parseInt(row.totalOrders as string, 10) || 0, campaigns: []
                        });
                    }
                    entryMap.get(key)!.campaigns.push({
                        id: row.campaignId, name: row.campaignName,
                        adSpend: parseFloat(row['adSpend(EGP)'] as string) || 0,
                        orders: parseInt(row.orders as string, 10) || 0,
                    });
                });
                setParsedEntries(Array.from(entryMap.values()));
            }
            
            setParsingErrors(localErrors);
            setFileProcessed(true);
        };
        reader.readAsText(file, 'UTF-8');
    };

    const handleConfirmImport = () => {
        addMultipleDailyEntries(parsedEntries);
        toast.success(`Successfully imported ${parsedEntries.length} daily entries!`);
        handleClearImport();
    };

    const inputClasses = "w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-gray-900 focus:ring-orange-500 focus:border-orange-500 transition-colors";
    const labelClasses = "block text-sm font-medium text-gray-700 mb-2";

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-900">إدخال يومي</h1>
            
            <div className="bg-white p-8 rounded-2xl border border-gray-200/80 shadow-sm space-y-8">
                <div className="flex items-center justify-center p-1 bg-gray-100 rounded-xl max-w-sm mx-auto relative border border-gray-200">
                    <span className={`absolute top-1 left-1 bottom-1 w-[calc(50%-0.25rem)] bg-white shadow-sm rounded-lg transition-transform duration-300 ease-in-out ${entryMode === 'bulk' ? 'translate-x-full' : 'translate-x-0'}`}></span>
                    <button onClick={() => setEntryMode('manual')} className="flex-1 py-2 text-sm font-semibold rounded-md relative z-10 transition-colors text-gray-800">إدخال يدوي</button>
                    <button onClick={() => setEntryMode('bulk')} className="flex-1 py-2 text-sm font-semibold rounded-md relative z-10 transition-colors text-gray-800">رفع بالجملة</button>
                </div>
            
                {entryMode === 'manual' ? (
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <fieldset className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div>
                                <label htmlFor="date" className={labelClasses}>التاريخ</label>
                                <input type="date" name="date" value={formData.date} onChange={handleInputChange} className={inputClasses} required/>
                            </div>
                            <div>
                                <label htmlFor="time" className={labelClasses}>الوقت</label>
                                <input type="time" name="time" value={formData.time} onChange={handleInputChange} className={inputClasses} required/>
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
                        
                        <div className="pt-8 border-t">
                             <fieldset className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-1">
                                    <label htmlFor="productId" className={labelClasses}>المنتج</label>
                                    <select name="productId" value={formData.productId} onChange={handleInputChange} className={inputClasses} required>
                                        <option value="">اختر منتج...</option>
                                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                 <div>
                                    <label htmlFor="totalUnitsSold" className={labelClasses}>إجمالي القطع المباعة</label>
                                    <input type="number" name="totalUnitsSold" value={formData.totalUnitsSold} onChange={handleInputChange} className={inputClasses} placeholder="0" required/>
                                </div>
                                <div>
                                   <div className="flex justify-between items-baseline">
                                       <label htmlFor="totalOrders" className={labelClasses}>إجمالي الأوردرات (يدوي)</label>
                                        {ordersDiscrepancy && (
                                            <span className={`text-xs font-bold ${ordersDiscrepancy.difference !== 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                                                فرق: {ordersDiscrepancy.difference > 0 ? '+' : ''}{ordersDiscrepancy.difference} ({ordersDiscrepancy.percentage.toFixed(1)}%)
                                            </span>
                                        )}
                                   </div>
                                    <input type="number" name="totalOrders" value={formData.totalOrders} onChange={handleInputChange} required className={inputClasses}/>
                                </div>
                            </fieldset>
                        </div>
        
                        <div className="pt-8 border-t">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">بيانات الحملات</h3>
                            {formData.productId ? (
                                <div className="space-y-4">
                                    {campaigns.map((campaign, index) => (
                                        <div key={campaign.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end p-4 bg-gray-50 rounded-lg border">
                                            <div className="flex-grow">
                                                <label className="text-xs font-medium text-gray-600">اسم الحملة</label>
                                                <input type="text" value={campaign.name} readOnly className={`${inputClasses} mt-1 bg-gray-200 cursor-not-allowed`} />
                                            </div>
                                            <div className="flex-shrink-0">
                                                <label className="text-xs font-medium text-gray-600">المصروف (ج.م)</label>
                                                <input type="number" step="0.01" value={campaign.adSpend} onChange={(e) => handleCampaignChange(index, 'adSpend', e.target.value)} className={`${inputClasses} mt-1`} />
                                            </div>
                                            <div className="flex-shrink-0">
                                                <label className="text-xs font-medium text-gray-600">الأوردرات</label>
                                                <input type="number" value={campaign.orders} onChange={(e) => handleCampaignChange(index, 'orders', e.target.value)} className={`${inputClasses} mt-1`} />
                                            </div>
                                        </div>
                                    ))}
                                    <div className="flex gap-3 pt-4">
                                        <input
                                            type="text"
                                            placeholder="إضافة حملة جديدة لهذا المنتج..."
                                            value={newCampaignName}
                                            onChange={(e) => setNewCampaignName(e.target.value)}
                                            className="flex-grow bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-gray-900 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                                        />
                                        <button type="button" onClick={handleAddCampaign} className="bg-sky-600 text-white font-semibold p-2.5 rounded-lg hover:bg-sky-700 flex items-center justify-center flex-shrink-0">
                                            <PlusIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-10 bg-gray-50 rounded-lg">
                                    <CubeIcon className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                                    <p className="text-sm text-gray-500">الرجاء اختيار منتج لعرض وإضافة حملاته.</p>
                                </div>
                            )}
                        </div>
        
                        <div className="pt-8 border-t text-right">
                            <button type="submit" className="bg-orange-500 text-white font-semibold py-3 px-8 rounded-lg hover:bg-orange-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500">
                                حفظ الإدخال
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-5 animate-fade-in">
                        <div className="p-4 bg-gray-50 rounded-lg border text-center space-y-3">
                             <p className="text-sm font-medium text-gray-700">1. تحميل القالب الشامل</p>
                             <p className="text-xs text-gray-500 max-w-md mx-auto">
                                سيقوم هذا بإنشاء قالب CSV يحتوي على صفوف لكل المنتجات والحملات الموجودة حاليًا، مما يسهل عليك ملء البيانات.
                            </p>
                             <button onClick={downloadDailyEntryTemplate} className="w-full md:w-auto flex items-center justify-center gap-2 bg-gray-100 text-gray-700 font-semibold py-2.5 px-4 rounded-lg hover:bg-gray-200 transition-colors border border-gray-300">
                                <DocumentArrowDownIcon className="w-5 h-5"/>
                                تحميل القالب (CSV)
                            </button>
                        </div>

                        <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-orange-500 transition-colors group text-center">
                            <CloudArrowUpIcon className="mx-auto h-10 w-10 text-gray-400 group-hover:text-orange-500 transition-colors" />
                            <label htmlFor="file-upload" className="mt-4 block text-sm font-semibold text-orange-600 hover:text-orange-500 cursor-pointer">
                                2. اختر ملفًا لرفعه
                            </label>
                            <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".csv" onChange={handleFileUpload} />
                            <p className="mt-1 text-xs text-gray-500">يجب أن يكون الملف بصيغة CSV</p>
                        </div>
    
                        {fileProcessed && (
                            <div className="mt-6 p-4 border rounded-lg bg-gray-50 space-y-4">
                                <h3 className="font-semibold text-gray-800">نتائج تحليل الملف</h3>
                                {parsingErrors.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                                            <h4 className="font-semibold text-red-600">تم العثور على {parsingErrors.length} أخطاء:</h4>
                                        </div>
                                        <ul className="list-disc list-inside text-sm text-red-700 max-h-40 overflow-y-auto mt-2 space-y-1 bg-red-50/50 p-3 rounded-md border border-red-200">
                                            {parsingErrors.map((err, i) => (
                                                <li key={i}><strong className="font-semibold">صف {err.row}:</strong> {err.message}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {parsedEntries.length > 0 && (
                                    <div>
                                         <div className="flex items-center gap-2">
                                            <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
                                            <h4 className="font-semibold text-emerald-600">{parsedEntries.length} إدخال يومي صالح للاستيراد.</h4>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">تم التحقق من صحة هذه الإدخالات. اضغط على تأكيد لإضافتها.</p>
                                    </div>
                                )}
                                {(parsingErrors.length === 0 && parsedEntries.length === 0) && (
                                     <p className="text-sm text-gray-500">لم يتم العثور على إدخالات صالحة في الملف.</p>
                                )}
                                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                                    <button type="button" onClick={handleClearImport} className="bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300">
                                        مسح وإلغاء
                                    </button>
                                    {parsedEntries.length > 0 && (
                                        <button type="button" onClick={handleConfirmImport} className="bg-emerald-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-emerald-700">
                                            تأكيد وإضافة {parsedEntries.length} إدخالات
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DailyEntryPage;
