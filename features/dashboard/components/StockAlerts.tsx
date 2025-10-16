import React from 'react';
import { ExclamationTriangleIcon, ArchiveBoxIcon } from '../../../shared/components/Icons';
import { StockAlert } from '../../../shared/types';

interface StockAlertsProps {
    alerts: StockAlert[];
}

const StockAlerts: React.FC<StockAlertsProps> = ({ alerts }) => {
    if (alerts.length === 0) {
        return null;
    }

    return (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg shadow-sm">
            <div className="flex">
                <div className="flex-shrink-0">
                    <ArchiveBoxIcon className="h-6 w-6 text-blue-500" aria-hidden="true" />
                </div>
                <div className="ml-3">
                    <h3 className="text-sm font-bold text-blue-800">
                        تنبيهات انخفاض المخزون ({alerts.length})
                    </h3>
                    <div className="mt-2 text-xs text-blue-700 space-y-1 max-h-24 overflow-y-auto">
                        {alerts.map((alert) => (
                            <p key={alert.productId}>
                                • منتج "<strong>{alert.productName}</strong>" وصل إلى <strong>{alert.currentStock}</strong> قطعة في المخزون (الحد: {alert.lowStockThreshold}).
                            </p>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StockAlerts;