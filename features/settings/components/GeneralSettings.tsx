import React, { useState } from 'react';
import { Settings } from '../../../shared/types';
import toast from 'react-hot-toast';

interface GeneralSettingsProps {
    settings: Settings;
    setSettings: (settings: Settings) => void;
}

const GeneralSettings: React.FC<GeneralSettingsProps> = ({ settings, setSettings }) => {
    const [localSettings, setLocalSettings] = useState(settings);

    const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLocalSettings(prev => ({...prev, [name]: parseFloat(value) || 0 }));
    };

    const saveSettings = () => {
        setSettings(localSettings);
        toast.success("تم حفظ الإعدادات!");
    };

    const inputClasses = "w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-gray-900 focus:ring-orange-500 focus:border-orange-500 transition-colors";
    const labelClasses = "block text-sm font-medium text-gray-700 mb-2";

    return (
        <div className="bg-white p-8 rounded-2xl border border-gray-200/80 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6">الإعدادات العامة</h2>
            <div className="space-y-8">
                <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="globalDeliveryRate" className={labelClasses}>نسبة التسليم العامة (%)</label>
                        <input type="number" name="globalDeliveryRate" id="globalDeliveryRate" value={localSettings.globalDeliveryRate} onChange={handleSettingsChange} className={inputClasses}/>
                    </div>
                     <div>
                        <label htmlFor="libyanDinarExchangeRate" className={labelClasses}>سعر صرف الدينار الليبي (مقابل ج.م)</label>
                        <input type="number" step="0.1" name="libyanDinarExchangeRate" id="libyanDinarExchangeRate" value={localSettings.libyanDinarExchangeRate} onChange={handleSettingsChange} className={inputClasses}/>
                    </div>
                </fieldset>
                 
                 <fieldset>
                    <legend className="text-md font-semibold text-gray-800 mb-4">نسب توزيع الأوردرات العامة (%)</legend>
                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                         <div>
                             <label htmlFor="orderDistribution1Unit" className={labelClasses}>أوردرات قطعة واحدة</label>
                             <input type="number" name="orderDistribution1Unit" value={localSettings.orderDistribution1Unit} onChange={handleSettingsChange} className={inputClasses}/>
                         </div>
                         <div>
                             <label htmlFor="orderDistribution2Units" className={labelClasses}>أوردرات قطعتين</label>
                             <input type="number" name="orderDistribution2Units" value={localSettings.orderDistribution2Units} onChange={handleSettingsChange} className={inputClasses}/>
                         </div>
                         <div>
                             <label htmlFor="orderDistribution3Units" className={labelClasses}>أوردرات ثلاث قطع</label>
                             <input type="number" name="orderDistribution3Units" value={localSettings.orderDistribution3Units} onChange={handleSettingsChange} className={inputClasses}/>
                         </div>
                          <div>
                             <label htmlFor="orderDistributionMoreThan3Units" className={labelClasses}>أوردرات +3 قطع</label>
                             <input type="number" name="orderDistributionMoreThan3Units" value={localSettings.orderDistributionMoreThan3Units} onChange={handleSettingsChange} className={inputClasses}/>
                         </div>
                     </div>
                 </fieldset>

                <fieldset>
                    <legend className="text-md font-semibold text-gray-800 mb-4">الأهداف الشهرية</legend>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         <div>
                             <label htmlFor="monthlyTargetRevenue" className={labelClasses}>هدف المبيعات (د.ل)</label>
                             <input type="number" name="monthlyTargetRevenue" value={localSettings.monthlyTargetRevenue} onChange={handleSettingsChange} className={inputClasses}/>
                         </div>
                          <div>
                             <label htmlFor="monthlyTargetUnitsSold" className={labelClasses}>هدف عدد القطع</label>
                             <input type="number" name="monthlyTargetUnitsSold" value={localSettings.monthlyTargetUnitsSold} onChange={handleSettingsChange} className={inputClasses}/>
                         </div>
                         <div>
                             <label htmlFor="monthlyTargetOrders" className={labelClasses}>هدف عدد الأوردرات</label>
                             <input type="number" name="monthlyTargetOrders" value={localSettings.monthlyTargetOrders} onChange={handleSettingsChange} className={inputClasses}/>
                         </div>
                     </div>
                </fieldset>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200 text-right">
                <button onClick={saveSettings} className="bg-orange-500 text-white font-semibold py-2.5 px-6 rounded-lg hover:bg-orange-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 focus:ring-offset-white">حفظ الإعدادات</button>
            </div>
        </div>
    );
};

export default GeneralSettings;
