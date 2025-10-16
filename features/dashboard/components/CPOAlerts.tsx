import React from 'react';
import { ExclamationTriangleIcon } from '../../../shared/components/Icons';
import { CPOAlert } from '../../../shared/types';

interface CPOAlertsProps {
    alerts: CPOAlert[];
    formatCurrency: (value: number) => string;
}

const CPOAlerts: React.FC<CPOAlertsProps> = ({ alerts, formatCurrency }) => {
    if (alerts.length === 0) {
        return null;
    }

    return (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg shadow-sm">
            <div className="flex">
                <div className="flex-shrink-0">
                    <ExclamationTriangleIcon className="h-6 w-6 text-amber-500" aria-hidden="true" />
                </div>
                <div className="ml-3">
                    <h3 className="text-sm font-bold text-amber-800">
                        تنبيهات تجاوز الحد الأقصى لتكلفة الأوردر ({alerts.length})
                    </h3>
                    <div className="mt-2 text-xs text-amber-700 space-y-1 max-h-24 overflow-y-auto">
                        {alerts.map((alert, index) => (
                            <p key={index}>
                                • بتاريخ <strong>{alert.date}</strong>، حملة "<strong>{alert.campaignName}</strong>" للمنتج "<strong>{alert.productName}</strong>" تجاوزت الحد بتكلفة <strong>{formatCurrency(alert.cpo)}</strong> (الحد: {formatCurrency(alert.maxCpo)}).
                            </p>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CPOAlerts;