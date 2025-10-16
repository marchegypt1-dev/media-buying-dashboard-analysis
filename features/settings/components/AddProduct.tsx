import React, { useState } from 'react';
import { Product, Season, Category, Gender } from '../../../shared/types';
import { CloudArrowUpIcon, DocumentArrowDownIcon, ExclamationTriangleIcon, CheckCircleIcon } from '../../../shared/components/Icons';
import toast from 'react-hot-toast';

interface AddProductProps {
    addProduct: (product: Omit<Product, 'id' | 'campaigns'>) => void;
    addMultipleProducts: (products: Omit<Product, 'id' | 'campaigns'>[]) => void;
    categories: Category[];
}

const genderLabels: Record<Gender, string> = {
    [Gender.Women]: 'حريمي',
    [Gender.Men]: 'رجالي',
    [Gender.Kids]: 'أطفال',
};

const AddProduct: React.FC<AddProductProps> = ({ addProduct, addMultipleProducts, categories }) => {
    const getInitialState = () => ({
        name: '', sellingPricePerUnit: '', costPerUnit: '', productDeliveryRate: '',
        otherFixedCostsPerUnit: '', sellingPrice1UnitOffer: '', sellingPrice2UnitsOffer: '',
        sellingPrice3UnitsOffer: '', season: Season.AllSeasons, maxCpo: '',
        categoryId: '', gender: Gender.Women, initialStock: '', lowStockThreshold: '',
    });
    
    const [newProduct, setNewProduct] = useState(getInitialState());
    const [entryMode, setEntryMode] = useState<'manual' | 'bulk'>('manual');
    
    // State for bulk upload processing
    const [parsedProducts, setParsedProducts] = useState<Omit<Product, 'id' | 'campaigns'>[]>([]);
    const [parsingErrors, setParsingErrors] = useState<{ row: number; message: string; }[]>([]);
    const [fileProcessed, setFileProcessed] = useState<boolean>(false);
    
    const handleProductChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewProduct(prev => ({ ...prev, [name]: value }));
    };

    const handleAddProduct = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!newProduct.categoryId) {
            toast.error("الرجاء اختيار فئة للمنتج.");
            return;
        }

        addProduct({
            name: newProduct.name,
            sellingPricePerUnit: parseFloat(newProduct.sellingPricePerUnit) || 0,
            costPerUnit: parseFloat(newProduct.costPerUnit) || 0,
            productDeliveryRate: newProduct.productDeliveryRate ? parseFloat(newProduct.productDeliveryRate) : undefined,
            otherFixedCostsPerUnit: newProduct.otherFixedCostsPerUnit ? parseFloat(newProduct.otherFixedCostsPerUnit) : undefined,
            sellingPrice1UnitOffer: newProduct.sellingPrice1UnitOffer ? parseFloat(newProduct.sellingPrice1UnitOffer) : undefined,
            sellingPrice2UnitsOffer: newProduct.sellingPrice2UnitsOffer ? parseFloat(newProduct.sellingPrice2UnitsOffer) : undefined,
            sellingPrice3UnitsOffer: newProduct.sellingPrice3UnitsOffer ? parseFloat(newProduct.sellingPrice3UnitsOffer) : undefined,
            season: newProduct.season,
            maxCpo: newProduct.maxCpo ? parseFloat(newProduct.maxCpo) : undefined,
            categoryId: newProduct.categoryId,
            gender: newProduct.gender,
            initialStock: newProduct.initialStock ? parseInt(newProduct.initialStock, 10) : undefined,
            lowStockThreshold: newProduct.lowStockThreshold ? parseInt(newProduct.lowStockThreshold, 10) : undefined,
        });

        setNewProduct(getInitialState());
        toast.success("تمت إضافة المنتج بنجاح!");
    };

    const downloadTemplate = () => {
        const header = "name,sellingPricePerUnit,costPerUnit,season,gender,categoryName,categoryId,productDeliveryRate,otherFixedCostsPerUnit,maxCpo,initialStock,lowStockThreshold,sellingPrice1UnitOffer,sellingPrice2UnitsOffer,sellingPrice3UnitsOffer\n";
        const example = "منتج تجريبي,150,75,SUMMER,WOMEN,بلوزات,,90,5,25,100,10,150,280,400\n";
        const bom = "\uFEFF"; // BOM for UTF-8
        const content = bom + header + example;
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "products_template.csv");
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleClearImport = () => {
        setParsedProducts([]);
        setParsingErrors([]);
        setFileProcessed(false);
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
                setFileProcessed(true);
                return;
            }
            
            const lines = text.split('\n').filter(line => line.trim() !== '');
            if (lines.length < 2) {
                setParsingErrors([{ row: 1, message: "File is empty or contains only a header." }]);
                setFileProcessed(true);
                return;
            }

            const headerLine = lines[0].replace(/^\uFEFF/, ''); // Remove BOM
            const header = headerLine.split(',').map(h => h.trim());
            const requiredHeaders = ['name', 'sellingPricePerUnit', 'costPerUnit', 'season', 'gender'];
            if (!requiredHeaders.every(h => header.includes(h))) {
                setParsingErrors([{ row: 1, message: `File header must contain at least: ${requiredHeaders.join(', ')}` }]);
                setFileProcessed(true);
                return;
            }
            if (!header.includes('categoryName') && !header.includes('categoryId')) {
                setParsingErrors([{ row: 1, message: "File header must contain either 'categoryName' or 'categoryId'." }]);
                setFileProcessed(true);
                return;
            }
            
            const productsToAdd: Omit<Product, 'id' | 'campaigns'>[] = [];
            const localErrors: { row: number; message: string; }[] = [];
            const numericFields = [
                'sellingPricePerUnit', 'costPerUnit', 'productDeliveryRate', 
                'otherFixedCostsPerUnit', 'sellingPrice1UnitOffer', 
                'sellingPrice2UnitsOffer', 'sellingPrice3UnitsOffer', 'maxCpo',
                'initialStock', 'lowStockThreshold'
            ];

            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',').map(v => v.trim());
                const rowNumber = i + 1;

                if (values.every(v => v === '')) continue; // Skip empty lines

                if (values.length < header.length) {
                    localErrors.push({ row: rowNumber, message: 'Row has fewer columns than the header.' });
                    continue;
                }

                const rowData: Record<string, string> = {};
                header.forEach((key, index) => {
                    rowData[key] = values[index] || '';
                });

                const rowErrors: string[] = [];
                const name = rowData.name;
                if (!name) {
                    rowErrors.push(`Product name is missing.`);
                }
                
                const seasonInput = rowData.season?.toUpperCase();
                if (!seasonInput || !Object.values(Season).includes(seasonInput as Season)) {
                    rowErrors.push(`Invalid or missing season '${rowData.season}'. Use one of: SUMMER, WINTER, ALL_SEASONS.`);
                }

                const genderInput = rowData.gender?.toUpperCase();
                if (!genderInput || !Object.values(Gender).includes(genderInput as Gender)) {
                    rowErrors.push(`Invalid gender. Use one of: WOMEN, MEN, KIDS.`);
                }

                let foundCategoryId: string | undefined;
                const categoryIdInput = rowData.categoryId;
                const categoryNameInput = rowData.categoryName;

                if (categoryIdInput) {
                    const category = categories.find(c => c.id === categoryIdInput);
                    if (category) {
                        foundCategoryId = category.id;
                    } else {
                        rowErrors.push(`CategoryId '${categoryIdInput}' not found.`);
                    }
                } else if (categoryNameInput) {
                    const category = categories.find(c => c.name.toLowerCase() === categoryNameInput.toLowerCase());
                    if (category) {
                        foundCategoryId = category.id;
                    } else {
                        rowErrors.push(`Category Name '${categoryNameInput}' not found. Please add it in settings first.`);
                    }
                } else {
                    rowErrors.push(`Row must have either 'categoryName' or 'categoryId'.`);
                }


                const parsedNumeric: {[key: string]: number | undefined} = {};
                numericFields.forEach(field => {
                    const valueStr = rowData[field];
                    const isRequired = ['sellingPricePerUnit', 'costPerUnit'].includes(field);

                    if (!valueStr) {
                        if (isRequired) {
                           rowErrors.push(`Required field '${field}' is missing.`);
                        }
                    } else {
                        const num = parseFloat(valueStr);
                        if (isNaN(num)) {
                            rowErrors.push(`Field '${field}' has an invalid number: '${valueStr}'.`);
                        } else {
                            parsedNumeric[field] = num;
                        }
                    }
                });

                if (rowErrors.length > 0) {
                    localErrors.push({ row: rowNumber, message: rowErrors.join(' | ') });
                } else {
                    productsToAdd.push({
                        name: name,
                        sellingPricePerUnit: parsedNumeric.sellingPricePerUnit!,
                        costPerUnit: parsedNumeric.costPerUnit!,
                        season: seasonInput as Season,
                        gender: genderInput as Gender,
                        categoryId: foundCategoryId!,
                        productDeliveryRate: parsedNumeric.productDeliveryRate,
                        otherFixedCostsPerUnit: parsedNumeric.otherFixedCostsPerUnit,
                        sellingPrice1UnitOffer: parsedNumeric.sellingPrice1UnitOffer,
                        sellingPrice2UnitsOffer: parsedNumeric.sellingPrice2UnitsOffer,
                        sellingPrice3UnitsOffer: parsedNumeric.sellingPrice3UnitsOffer,
                        maxCpo: parsedNumeric.maxCpo,
                        initialStock: parsedNumeric.initialStock,
                        lowStockThreshold: parsedNumeric.lowStockThreshold,
                    });
                }
            }
            
            setParsedProducts(productsToAdd);
            setParsingErrors(localErrors);
            setFileProcessed(true);
        };
        reader.readAsText(file, 'UTF-8');
        event.target.value = '';
    };

    const handleConfirmImport = () => {
        addMultipleProducts(parsedProducts);
        toast.success(`Successfully imported ${parsedProducts.length} products!`);
        handleClearImport();
    };

    const inputClasses = "w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-gray-900 focus:ring-orange-500 focus:border-orange-500 transition-colors";
    const labelClasses = "block text-sm font-medium text-gray-700 mb-2";
    
    return (
        <div className="bg-white p-8 rounded-2xl border border-gray-200/80 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6">إضافة منتج جديد</h2>
            <div className="flex items-center justify-center p-1 bg-gray-100 rounded-xl mb-6 relative border border-gray-200">
                <span className={`absolute top-1 left-1 bottom-1 w-[calc(50%-0.25rem)] bg-white shadow-sm rounded-lg transition-transform duration-300 ease-in-out ${entryMode === 'bulk' ? 'translate-x-full' : 'translate-x-0'}`}></span>
                <button onClick={() => setEntryMode('manual')} className="flex-1 py-2 text-sm font-semibold rounded-md relative z-10 transition-colors text-gray-800">إدخال يدوي</button>
                <button onClick={() => setEntryMode('bulk')} className="flex-1 py-2 text-sm font-semibold rounded-md relative z-10 transition-colors text-gray-800">رفع بالجملة</button>
            </div>

            {entryMode === 'manual' ? (
                <form onSubmit={handleAddProduct} className="space-y-6">
                    <fieldset className="space-y-4">
                        <div>
                           <label htmlFor="name" className={labelClasses}>اسم المنتج</label>
                           <input type="text" id="name" name="name" value={newProduct.name} onChange={handleProductChange} placeholder="اسم المنتج" required className={inputClasses}/>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="categoryId" className={labelClasses}>الفئة</label>
                                <select name="categoryId" id="categoryId" value={newProduct.categoryId} onChange={handleProductChange} required className={inputClasses}>
                                    <option value="">اختر فئة...</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="gender" className={labelClasses}>الجنس</label>
                                <select name="gender" id="gender" value={newProduct.gender} onChange={handleProductChange} className={inputClasses}>
                                    {Object.values(Gender).map(g => <option key={g} value={g}>{genderLabels[g]}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="sellingPricePerUnit" className={labelClasses}>سعر البيع (د.ل)</label>
                                <input type="number" step="0.01" id="sellingPricePerUnit" name="sellingPricePerUnit" value={newProduct.sellingPricePerUnit} onChange={handleProductChange} placeholder="0.00" required className={inputClasses}/>
                            </div>
                            <div>
                                <label htmlFor="costPerUnit" className={labelClasses}>التكلفة (د.ل)</label>
                                <input type="number" step="0.01" id="costPerUnit" name="costPerUnit" value={newProduct.costPerUnit} onChange={handleProductChange} placeholder="0.00" required className={inputClasses}/>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="season" className={labelClasses}>الموسم</label>
                            <select name="season" id="season" value={newProduct.season} onChange={handleProductChange} className={inputClasses}>
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
                                <input type="number" step="0.01" id="maxCpo" name="maxCpo" value={newProduct.maxCpo} onChange={handleProductChange} placeholder="25" className={inputClasses}/>
                            </div>
                            <div>
                                <label htmlFor="productDeliveryRate" className={labelClasses}>نسبة تسليم خاصة (%)</label>
                                <input type="number" step="0.1" id="productDeliveryRate" name="productDeliveryRate" value={newProduct.productDeliveryRate} onChange={handleProductChange} placeholder="90" className={inputClasses}/>
                            </div>
                            <div>
                                <label htmlFor="otherFixedCostsPerUnit" className={labelClasses}>تكاليف ثابتة أخرى (للقطعة)</label>
                                <input type="number" step="0.01" id="otherFixedCostsPerUnit" name="otherFixedCostsPerUnit" value={newProduct.otherFixedCostsPerUnit} onChange={handleProductChange} placeholder="5.00" className={inputClasses}/>
                            </div>
                         </div>
                         <div className="grid grid-cols-2 gap-4 pt-4 border-t mt-4">
                            <div>
                                <label htmlFor="initialStock" className={labelClasses}>الكمية الأولية بالمخزون</label>
                                <input type="number" id="initialStock" name="initialStock" value={newProduct.initialStock} onChange={handleProductChange} placeholder="100" className={inputClasses}/>
                            </div>
                            <div>
                                <label htmlFor="lowStockThreshold" className={labelClasses}>حد تنبيه انخفاض المخزون</label>
                                <input type="number" id="lowStockThreshold" name="lowStockThreshold" value={newProduct.lowStockThreshold} onChange={handleProductChange} placeholder="10" className={inputClasses}/>
                            </div>
                        </div>
                         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t mt-4">
                            <div>
                                <label htmlFor="sellingPrice1UnitOffer" className={labelClasses}>عرض قطعة (د.ل)</label>
                                <input type="number" step="0.01" id="sellingPrice1UnitOffer" name="sellingPrice1UnitOffer" value={newProduct.sellingPrice1UnitOffer} onChange={handleProductChange} placeholder="0.00" className={inputClasses}/>
                            </div>
                             <div>
                                <label htmlFor="sellingPrice2UnitsOffer" className={labelClasses}>عرض قطعتين (د.ل)</label>
                                <input type="number" step="0.01" id="sellingPrice2UnitsOffer" name="sellingPrice2UnitsOffer" value={newProduct.sellingPrice2UnitsOffer} onChange={handleProductChange} placeholder="0.00" className={inputClasses}/>
                            </div>
                             <div>
                                <label htmlFor="sellingPrice3UnitsOffer" className={labelClasses}>عرض 3 قطع (د.ل)</label>
                                <input type="number" step="0.01" id="sellingPrice3UnitsOffer" name="sellingPrice3UnitsOffer" value={newProduct.sellingPrice3UnitsOffer} onChange={handleProductChange} placeholder="0.00" className={inputClasses}/>
                            </div>
                         </div>
                    </fieldset>
                    <button type="submit" className="w-full bg-emerald-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-emerald-700 transition-colors duration-300">إضافة المنتج</button>
                </form>
            ) : (
                <div className="space-y-5">
                    <div className="text-center">
                        <p className="text-sm text-gray-500">
                            قم بتحميل القالب، املأ بيانات منتجاتك، ثم قم برفع الملف هنا.
                        </p>
                        <button onClick={downloadTemplate} className="w-full mt-3 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 font-semibold py-2.5 px-4 rounded-lg hover:bg-gray-200 transition-colors border border-gray-300">
                            <DocumentArrowDownIcon className="w-5 h-5"/>
                            تحميل القالب (CSV)
                        </button>
                    </div>
                    <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-orange-500 transition-colors group text-center">
                        <CloudArrowUpIcon className="mx-auto h-10 w-10 text-gray-400 group-hover:text-orange-500 transition-colors" />
                        <label htmlFor="file-upload" className="mt-4 block text-sm font-semibold text-orange-600 hover:text-orange-500 cursor-pointer">
                            اختر ملفًا لرفعه
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
                            {parsedProducts.length > 0 && (
                                <div>
                                     <div className="flex items-center gap-2">
                                        <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
                                        <h4 className="font-semibold text-emerald-600">{parsedProducts.length} منتج صالح للاستيراد.</h4>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">تم التحقق من صحة هذه المنتجات. اضغط على تأكيد لإضافتها إلى قائمتك.</p>
                                </div>
                            )}
                            {(parsingErrors.length === 0 && parsedProducts.length === 0) && (
                                 <p className="text-sm text-gray-500">لم يتم العثور على منتجات صالحة في الملف.</p>
                            )}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                                <button type="button" onClick={handleClearImport} className="bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300">
                                    مسح وإلغاء
                                </button>
                                {parsedProducts.length > 0 && (
                                    <button type="button" onClick={handleConfirmImport} className="bg-emerald-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-emerald-700">
                                        تأكيد وإضافة {parsedProducts.length} منتجات
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AddProduct;
