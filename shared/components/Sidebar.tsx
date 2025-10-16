import React from 'react';
import { Page } from '../types';
import { DashboardIcon, EntryIcon, SettingsIcon, ChartBarIcon, DocumentChartBarIcon } from './Icons';

interface SidebarProps {
    activePage: Page;
    setActivePage: (page: Page) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage }) => {
    const navItems = [
        { id: Page.Dashboard, icon: DashboardIcon, label: 'لوحة التحكم' },
        { id: Page.DailyEntry, icon: EntryIcon, label: 'إدخال يومي' },
        { id: Page.Settings, icon: SettingsIcon, label: 'الإعدادات والمنتجات' },
        { id: Page.Reports, icon: DocumentChartBarIcon, label: 'التقارير' },
    ];

    return (
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col p-4 flex-shrink-0">
            <div className="text-xl font-bold text-gray-800 mb-12 px-2 flex items-center gap-3">
               <div className="w-9 h-9 bg-gray-900 rounded-full flex items-center justify-center">
                    <ChartBarIcon className="w-5 h-5 text-white" />
               </div>
               <span>Dashboard</span>
            </div>
            <nav className="flex flex-col gap-2">
                {navItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => setActivePage(item.id)}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                            activePage === item.id 
                                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' 
                                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                    >
                        <item.icon className="w-5 h-5" />
                        {item.label}
                    </button>
                ))}
            </nav>
        </aside>
    );
}

export default Sidebar;
