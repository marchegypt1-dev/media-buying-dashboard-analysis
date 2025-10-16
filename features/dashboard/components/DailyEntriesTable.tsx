import React, { useState, useMemo, Fragment } from 'react';
import { DailyEntry, Product, SourceFilter, EntryType } from '../../../shared/types';
import { TrashIcon, ExclamationTriangleIcon, CubeIcon, PencilIcon, ChevronRightIcon } from '../../../shared/components/Icons';
import { useStore } from '../../../shared/store/useStore';

interface DailyEntriesTableProps {
    entries: DailyEntry[];
    products: Product[];
    deleteDailyEntry: (id: string) => void;
    onEditEntry: (entry: DailyEntry) => void;
    formatCurrency: (value: number) => string;
}

const EntryRow: React.FC<{
    entry: DailyEntry;
    product?: Product;
    isSubEntry: boolean;
    hasSubEntries?: boolean;
    isExpanded?: boolean;
    onToggleExpand?: () => void;
    onEditEntry: (entry: DailyEntry) => void;
    deleteDailyEntry: (id: string) => void;
    formatCurrency: (value: number) => string;
}> = ({
    entry, product, isSubEntry, hasSubEntries, isExpanded,
    onToggleExpand, onEditEntry, deleteDailyEntry, formatCurrency
}) => {
    const { settings } = useStore.getState();
    if (!product) return null;

    const totalAdSpend = entry.campaigns.reduce((sum, c) => sum + c.adSpend, 0) / settings.libyanDinarExchangeRate;
    const appliedDeliveryRate = (product.productDeliveryRate ?? settings.globalDeliveryRate) / 100;
    const effectiveOrders = entry.totalOrders * appliedDeliveryRate;
    const cpo = effectiveOrders > 0 ? totalAdSpend / effectiveOrders : 0;
    const isCpoExceeded = product.maxCpo && cpo > product.maxCpo;

    const rowClasses = isSubEntry
        ? "bg-gray-50/50 hover:bg-gray-100 transition-colors duration-200"
        : "group hover:bg-gray-50 transition-colors duration-200";
    
    const textClasses = isSubEntry ? "text-gray-500" : "text-gray-700";

    return (
        <tr key={entry.id} className={rowClasses}>
            <td className={`pl-4 pr-2 py-4 ${textClasses}`}>
                <div className="flex items-center gap-2">
                    {hasSubEntries ? (
                        <button onClick={onToggleExpand} className="p-1 rounded-full hover:bg-gray-200">
                            <ChevronRightIcon className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </button>
                    ) : (
                         <span className="w-5 h-5 inline-block"></span> // Placeholder for alignment
                    )}
                     {isSubEntry && <div className="w-4 h-px bg-gray-300 ml-2 mr-1"></div>}
                    <span>{entry.date} <span className={isSubEntry ? "text-gray-400" : "text-gray-500"}>{entry.time}</span></span>
                </div>
            </td>
            <td className={`px-4 py-4 font-semibold ${isSubEntry ? 'text-gray-700' : 'text-gray-900'}`}>{product?.name || 'N/A'}</td>
            <td className={`px-4 py-4 ${textClasses}`}>{entry.source === SourceFilter.Website ? 'الموقع' : 'البيدج'}</td>
            <td className={`px-4 py-4 ${textClasses}`}>{entry.totalUnitsSold}</td>
            <td className={`px-4 py-4 ${textClasses}`}>{entry.totalOrders}</td>
            <td className={`px-4 py-4 font-medium ${isCpoExceeded ? 'text-red-600' : isSubEntry ? 'text-gray-600' : 'text-gray-800'}`}>
                <div className="flex items-center gap-1">
                    {formatCurrency(cpo)}
                    {isCpoExceeded && <ExclamationTriangleIcon className="w-4 h-4 text-red-500" title={`تجاوز الحد الأقصى: ${formatCurrency(product.maxCpo!)}`} />}
                </div>
            </td>
            <td className="px-4 py-4 text-right">
                <div className={`flex items-center justify-end ${isSubEntry ? '' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                    <button onClick={() => onEditEntry(entry)} className="text-gray-400 hover:text-blue-500 transition-colors p-1.5 rounded-full">
                        <PencilIcon className="w-4 h-4"/>
                    </button>
                    <button onClick={() => deleteDailyEntry(entry.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded-full">
                        <TrashIcon className="w-4 h-4"/>
                    </button>
                </div>
            </td>
        </tr>
    );
};


const DailyEntriesTable: React.FC<DailyEntriesTableProps> = ({ entries, products, deleteDailyEntry, onEditEntry, formatCurrency }) => {
    
    const [expandedEntryIds, setExpandedEntryIds] = useState<Set<string>>(new Set());

    const groupedEntries = useMemo(() => {
        const groups: Record<string, { final: DailyEntry[], sub: DailyEntry[] }> = {};
        const sortedEntries = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.time.localeCompare(a.time));
        
        sortedEntries.forEach(entry => {
            const date = entry.date;
            if (!groups[date]) {
                groups[date] = { final: [], sub: [] };
            }
            if (entry.entryType === EntryType.Final) {
                groups[date].final.push(entry);
            } else {
                groups[date].sub.push(entry);
            }
        });
        return Object.values(groups).filter(g => g.final.length > 0 || g.sub.length > 0);
    }, [entries]);

    const toggleExpand = (entryId: string) => {
        setExpandedEntryIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(entryId)) {
                newSet.delete(entryId);
            } else {
                newSet.add(entryId);
            }
            return newSet;
        });
    };

    const getProduct = (productId: string) => products.find(p => p.id === productId);

    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
            <h2 className="text-base font-semibold text-gray-800 mb-4">أحدث الإدخالات</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 font-medium tracking-wider">التاريخ والوقت</th>
                            <th className="px-4 py-3 font-medium tracking-wider">المنتج</th>
                            <th className="px-4 py-3 font-medium tracking-wider">المصدر</th>
                            <th className="px-4 py-3 font-medium tracking-wider">القطع</th>
                            <th className="px-4 py-3 font-medium tracking-wider">الأوردرات</th>
                            <th className="px-4 py-3 font-medium tracking-wider">CPO</th>
                            <th className="px-4 py-3 font-medium tracking-wider"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {groupedEntries.length > 0 ? groupedEntries.map((group) => {
                             const date = group.final[0]?.date || group.sub[0]?.date;
                            return (
                                <Fragment key={date}>
                                    {/* Render Final Entries, which are expandable */}
                                    {group.final.map(finalEntry => (
                                        <Fragment key={finalEntry.id}>
                                            <EntryRow
                                                entry={finalEntry}
                                                product={getProduct(finalEntry.productId)}
                                                isSubEntry={false}
                                                hasSubEntries={group.sub.length > 0}
                                                isExpanded={expandedEntryIds.has(finalEntry.id)}
                                                onToggleExpand={() => toggleExpand(finalEntry.id)}
                                                onEditEntry={onEditEntry}
                                                deleteDailyEntry={deleteDailyEntry}
                                                formatCurrency={formatCurrency}
                                            />
                                            {/* Render Sub Entries if expanded */}
                                            {expandedEntryIds.has(finalEntry.id) && group.sub.map(subEntry => (
                                                <EntryRow
                                                    key={subEntry.id}
                                                    entry={subEntry}
                                                    product={getProduct(subEntry.productId)}
                                                    isSubEntry={true}
                                                    onEditEntry={onEditEntry}
                                                    deleteDailyEntry={deleteDailyEntry}
                                                    formatCurrency={formatCurrency}
                                                />
                                            ))}
                                        </Fragment>
                                    ))}

                                    {/* If no final entries for the day, render sub entries as top-level */}
                                    {group.final.length === 0 && group.sub.map(subEntry => (
                                        <EntryRow
                                            key={subEntry.id}
                                            entry={subEntry}
                                            product={getProduct(subEntry.productId)}
                                            isSubEntry={false}
                                            hasSubEntries={false}
                                            onEditEntry={onEditEntry}
                                            deleteDailyEntry={deleteDailyEntry}
                                            formatCurrency={formatCurrency}
                                        />
                                    ))}
                                </Fragment>
                            );
                        }) : (
                            <tr>
                                <td colSpan={7} className="text-center py-16 text-gray-500">
                                    <div className="flex flex-col items-center">
                                        <CubeIcon className="w-10 h-10 text-gray-400 mb-3"/>
                                        <span className="font-medium">لا توجد إدخالات.</span>
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

export default DailyEntriesTable;
