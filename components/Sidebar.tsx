import React from 'react';
import { Tab } from '../types';

interface SidebarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  onLanguageChange: (lang: 'en' | 'ar') => void;
  lang: 'en' | 'ar';
}

const NavItem: React.FC<{ tab: Tab; activeTab: Tab; setActiveTab: (tab: Tab) => void; label: string; icon: React.ReactNode }> = ({ tab, activeTab, setActiveTab, label, icon }) => (
    <li>
        <button
            onClick={() => setActiveTab(tab)}
            className={`flex items-center w-full p-3 text-base font-normal rounded-lg transition-colors duration-200 ${
                activeTab === tab 
                ? 'bg-primary-600 text-white shadow-lg' 
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
        >
            {icon}
            <span className="ml-3 rtl:mr-3 whitespace-nowrap">{label}</span>
        </button>
    </li>
);

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLanguageChange, lang }) => {
    const logoUrl = "data:image/png;base64,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";
    const navItems: { tab: Tab, label: string, icon: React.ReactNode }[] = [
        { tab: 'dashboard', label: 'Dashboard', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> },
        { tab: 'directory', label: 'Directory', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21V5a2 2 0 00-2-2H9a2 2 0 00-2 2v16" /></svg> },
        { tab: 'saudization', label: 'Saudization', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg> },
        { tab: 'payroll', label: 'Payroll', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
        { tab: 'loans', label: 'Personal Loans', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm-5-12h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-1" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
        { tab: 'reports', label: 'Reports', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
        { tab: 'eosb', label: 'EOSB Calc', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg> },
        { tab: 'leave', label: 'Leave Mgt', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
        { tab: 'ask-ai', label: 'Ask AI', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    ];
    
    return (
        <aside className="w-64 bg-white dark:bg-slate-800 shadow-lg flex flex-col p-4 border-r border-slate-200 dark:border-slate-700">
            <div className="px-2 mb-6">
                <img src={logoUrl} alt="Special Offices Company Logo" className="h-16 w-auto" />
            </div>
            <nav className="flex-1">
                <ul className="space-y-2">
                    {navItems.map(item => <NavItem key={item.tab} {...item} activeTab={activeTab} setActiveTab={setActiveTab} />)}
                </ul>
            </nav>
            <div className="mt-auto space-y-4 p-2">
                 <div className="flex items-center justify-center space-x-2 bg-slate-100 dark:bg-slate-700 p-1 rounded-full">
                    <button 
                        onClick={() => onLanguageChange('en')}
                        className={`px-4 py-1 text-sm font-semibold rounded-full ${lang === 'en' ? 'bg-primary-600 text-white' : 'text-slate-600 dark:text-slate-300'}`}
                    >
                        EN
                    </button>
                    <button 
                        onClick={() => onLanguageChange('ar')}
                        className={`px-4 py-1 text-sm font-semibold rounded-full ${lang === 'ar' ? 'bg-primary-600 text-white' : 'text-slate-600 dark:text-slate-300'}`}
                    >
                        AR
                    </button>
                </div>
            </div>
        </aside>
    );
};