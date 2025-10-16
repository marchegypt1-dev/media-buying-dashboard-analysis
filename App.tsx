import React, { useState } from 'react';
import { Page } from './shared/types';
import Sidebar from './shared/components/Sidebar';
import DashboardPage from './features/dashboard/DashboardPage';
import DailyEntryPage from './features/daily-entry/DailyEntryPage';
import SettingsPage from './features/settings/SettingsPage';
import ReportsPage from './features/reports/ReportsPage';
import 'v8-compile-cache';
import { Toaster } from 'react-hot-toast';

const App: React.FC = () => {
    const [activePage, setActivePage] = useState<Page>(Page.Dashboard);
    
    const renderPage = () => {
        switch (activePage) {
            case Page.Dashboard:
                return <DashboardPage />;
            case Page.DailyEntry:
                return <DailyEntryPage />;
            case Page.Settings:
                return <SettingsPage />;
            case Page.Reports:
                 return <ReportsPage />;
            default:
                return <DashboardPage />;
        }
    };

    return (
        <div className="flex h-screen bg-gray-50 text-gray-800">
            <Toaster position="bottom-center" toastOptions={{
                duration: 3000,
                style: {
                    background: '#333',
                    color: '#fff',
                },
            }}/>
            <Sidebar activePage={activePage} setActivePage={setActivePage} />
            <main className="flex-1 overflow-y-auto p-8">
                {renderPage()}
            </main>
        </div>
    );
};

export default App;
