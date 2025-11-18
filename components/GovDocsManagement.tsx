import React, { useState, useMemo } from 'react';
import { GovernmentalDocument, GovDocsManagementProps } from '../types';
import { StatCard } from './StatCard';
import { AddGovDocModal } from './AddGovDocModal';
import { GovDocDetailModal } from './GovDocDetailModal';

type SortKey = keyof GovernmentalDocument | 'status';
type SortOrder = 'asc' | 'desc';

const formatDate = (date: Date | null): string => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-CA');
};

const daysUntil = (date: Date | null): number => {
    if (!date) return Infinity;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const diffTime = targetDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const getStatus = (expiryDate: Date | null): { text: string; color: string } => {
    const days = daysUntil(expiryDate);
    if (days < 0) return { text: 'Expired', color: 'bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-300' };
    if (days <= 30) return { text: 'Expiring Soon', color: 'bg-yellow-200 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' };
    return { text: 'Valid', color: 'bg-green-200 text-green-800 dark:bg-green-900/50 dark:text-green-300' };
};


export const GovDocsManagement: React.FC<GovDocsManagementProps> = ({ govDocs, onAddGovDoc, onUpdateGovDoc, onDeleteGovDoc }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; order: SortOrder }>({ key: 'expiryDate', order: 'asc' });
    const [selectedDoc, setSelectedDoc] = useState<GovernmentalDocument | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState('');

    const dashboardStats = useMemo(() => {
        const expiringSoon = govDocs.filter(d => daysUntil(d.expiryDate) >= 0 && daysUntil(d.expiryDate) <= 30);
        const expired = govDocs.filter(d => daysUntil(d.expiryDate) < 0);
        const expiringSoonCost = expiringSoon.reduce((sum, doc) => sum + (doc.costToRenew || 0), 0);

        return {
            total: govDocs.length,
            expiringSoonCount: expiringSoon.length,
            expiredCount: expired.length,
            expiringSoonCost
        };
    }, [govDocs]);
    
    const sortedAndFilteredDocs = useMemo(() => {
        let items = [...govDocs];

        if (searchTerm) {
            const lowercasedFilter = searchTerm.toLowerCase();
            items = items.filter(d =>
                d.documentName.toLowerCase().includes(lowercasedFilter) ||
                d.documentNumber.toLowerCase().includes(lowercasedFilter) ||
                d.documentType.toLowerCase().includes(lowercasedFilter)
            );
        }
        
        if (statusFilter) {
            items = items.filter(d => getStatus(d.expiryDate).text === statusFilter);
        }

        items.sort((a, b) => {
            const key = sortConfig.key;
            const order = sortConfig.order;
            
            let valA: any;
            let valB: any;
            
            if (key === 'status') {
                valA = daysUntil(a.expiryDate);
                valB = daysUntil(b.expiryDate);
            } else {
                valA = a[key as keyof GovernmentalDocument];
                valB = b[key as keyof GovernmentalDocument];
            }
            
            if (valA === null || valA === undefined) return 1;
            if (valB === null || valB === undefined) return -1;
            
            let comparison = 0;
            if (valA instanceof Date && valB instanceof Date) {
                comparison = valA.getTime() - valB.getTime();
            } else if (typeof valA === 'number' && typeof valB === 'number') {
                comparison = valA - valB;
            } else {
                comparison = String(valA).toLowerCase().localeCompare(String(valB).toLowerCase());
            }
            return order === 'asc' ? comparison : -comparison;
        });

        return items;
    }, [govDocs, searchTerm, sortConfig, statusFilter]);
    
    const requestSort = (key: SortKey) => {
        const order = (sortConfig.key === key && sortConfig.order === 'asc') ? 'desc' : 'asc';
        setSortConfig({ key, order });
    };

    const exportToCsv = () => {
        const filename = `gov_docs_data_${new Date().toISOString().split('T')[0]}.csv`;
        const headers = ["Document Type", "Document Name", "Document Number", "Issuing Authority", "Issue Date", "Expiry Date", "Cost to Renew", "Renewal Frequency"];
        
        const data = sortedAndFilteredDocs.map(d => [
            `"${d.documentType}"`, `"${d.documentName}"`, `"${d.documentNumber}"`, `"${d.issuingAuthority}"`,
            formatDate(d.issueDate), formatDate(d.expiryDate), d.costToRenew, `"${d.renewalFrequency}"`
        ].join(','));
        
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...data].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <>
            <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Total Documents" value={dashboardStats.total} color="text-primary-600 bg-primary-100 dark:bg-primary-900/50" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} />
                    <StatCard title="Expiring in 30 Days" value={dashboardStats.expiringSoonCount} color="text-yellow-600 bg-yellow-100 dark:bg-yellow-900/50" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
                    <StatCard title="Expired" value={dashboardStats.expiredCount} color="text-red-600 bg-red-100 dark:bg-red-900/50" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>} />
                    <StatCard title="Next 30-Day Cost" value={`SAR ${dashboardStats.expiringSoonCost.toLocaleString()}`} color="text-green-600 bg-green-100 dark:bg-green-900/50" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} />
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">All Governmental Documents</h2>
                        <div className="flex items-center gap-2">
                            <button onClick={exportToCsv} className="flex items-center justify-center gap-2 bg-slate-600 dark:bg-slate-700 text-white font-semibold py-2 px-4 rounded-md hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors text-sm">Export</button>
                            <button onClick={() => setIsAddModalOpen(true)} className="flex items-center justify-center gap-2 bg-primary-600 text-white font-bold py-2 px-4 rounded-md hover:bg-primary-700 transition-colors text-sm">Add Document</button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <input
                            type="text"
                            placeholder="Search by name, number, or type..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-2 border bg-transparent border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-primary-500 transition"
                        />
                         <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="p-2 border bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-primary-500 transition w-full">
                            <option value="">All Statuses</option>
                            <option value="Valid">Valid</option>
                            <option value="Expiring Soon">Expiring Soon</option>
                            <option value="Expired">Expired</option>
                        </select>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                            <thead className="text-xs text-slate-700 dark:text-slate-300 uppercase bg-slate-100 dark:bg-slate-700">
                                <tr>
                                    {[{key: 'documentName', label: 'Document'}, {key: 'documentNumber', label: 'Number'}, {key: 'expiryDate', label: 'Expiry Date'}, {key: 'costToRenew', label: 'Renewal Cost'}, {key: 'status', label: 'Status'}].map(({key, label}) => (
                                        <th key={key} scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestSort(key as SortKey)}>
                                            {label} {sortConfig.key === key ? (sortConfig.order === 'asc' ? '▲' : '▼') : ''}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {sortedAndFilteredDocs.map(doc => {
                                    const status = getStatus(doc.expiryDate);
                                    return (
                                    <tr key={doc.id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer" onClick={() => setSelectedDoc(doc)}>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900 dark:text-white">{doc.documentName}</div>
                                            <div className="text-xs text-slate-500">{doc.documentType}</div>
                                        </td>
                                        <td className="px-6 py-4">{doc.documentNumber}</td>
                                        <td className="px-6 py-4">{formatDate(doc.expiryDate)}</td>
                                        <td className="px-6 py-4">SAR {doc.costToRenew.toLocaleString()}</td>
                                        <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>{status.text}</span></td>
                                    </tr>
                                )})}
                                 {sortedAndFilteredDocs.length === 0 && (
                                    <tr><td colSpan={5} className="text-center py-10">No documents found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            {isAddModalOpen && <AddGovDocModal onClose={() => setIsAddModalOpen(false)} onAddGovDoc={onAddGovDoc} />}
            {selectedDoc && <GovDocDetailModal doc={selectedDoc} onClose={() => setSelectedDoc(null)} onUpdateGovDoc={onUpdateGovDoc} onDeleteGovDoc={onDeleteGovDoc} />}
        </>
    );
};
