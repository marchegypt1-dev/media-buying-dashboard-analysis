import React from 'react';
import KPICard from './KPICard';
import { IKPI } from '../hooks/useDashboardData';

interface KPICardsGridProps {
    kpis: IKPI[];
}

const KPICardsGrid: React.FC<KPICardsGridProps> = ({ kpis }) => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {kpis.map(kpi => (
                <KPICard
                    key={kpi.title}
                    title={kpi.title}
                    value={kpi.value}
                    subValue={kpi.subValue}
                    trend={kpi.trend}
                    isPositiveGood={kpi.isPositiveGood}
                    icon={kpi.icon}
                    color={kpi.color}
                />
            ))}
        </div>
    );
};

export default KPICardsGrid;
