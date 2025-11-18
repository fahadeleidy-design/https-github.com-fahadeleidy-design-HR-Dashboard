import React, { useState } from 'react';
import { GovernmentalDocument, AddGovDocModalProps } from '../types';

const predefinedDocTypes = [
    "Commercial Registration (CR)", "Municipality License", "Manufacturing License", "Import/Export License", 
    "Zakat & Tax Registration (ZATCA)", "Social Security Registration (GOSI)", "Labor Office Registration", 
    "Environmental Compliance Certificate", "VAT Registration Certificate", "Chamber of Commerce Membership"
];

const renewalFrequencies = ["Annual", "Bi-annual", "Quarterly", "Every 2 Years", "Every 3 Years", "Every 5 Years", "One-time"];

export const AddGovDocModal: React.FC<AddGovDocModalProps> = ({ onClose, onAddGovDoc }) => {
    const [newDoc, setNewDoc] = useState<Partial<Omit<GovernmentalDocument, 'id'>>>({
        documentType: predefinedDocTypes[0],
        documentName: '',
        documentNumber: '',
        issuingAuthority: '',
        issueDate: null,
        expiryDate: null,
        costToRenew: 0,
        renewalFrequency: renewalFrequencies[0],
    });
    const [isCustomType, setIsCustomType] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (name === 'documentType' && value === 'custom') {
            setIsCustomType(true);
            setNewDoc(prev => ({ ...prev, documentType: '' }));
        } else {
            if (name === 'documentType') setIsCustomType(false);
            setNewDoc(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) : value }));
        }
    };
    
    const handleDateChange = (name: 'issueDate' | 'expiryDate', value: string) => {
        setNewDoc(prev => ({ ...prev, [name]: value ? new Date(value) : null }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDoc.documentType || !newDoc.documentName || !newDoc.documentNumber || !newDoc.expiryDate) {
            alert('Document Type, Name, Number, and Expiry Date are required.');
            return;
        }
        onAddGovDoc(newDoc as Omit<GovernmentalDocument, 'id'>);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
                    <h2 className="text-xl font-bold">Add New Governmental Document</h2>
                </header>
                <main className="p-6 overflow-y-auto">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-medium">Document Type</label>
                                <select name="documentType" value={isCustomType ? 'custom' : newDoc.documentType} onChange={handleInputChange} className="w-full p-2 border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-md">
                                    {predefinedDocTypes.map(type => <option key={type} value={type}>{type}</option>)}
                                    <option value="custom">-- Custom Type --</option>
                                </select>
                            </div>
                            {isCustomType && (
                                <div>
                                    <label className="block text-sm font-medium">Custom Document Type</label>
                                    <input type="text" name="documentType" value={newDoc.documentType} onChange={handleInputChange} className="w-full p-2 border bg-transparent border-slate-300 dark:border-slate-600 rounded-md" required/>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium">Document Name / Description</label>
                                <input type="text" name="documentName" value={newDoc.documentName} onChange={handleInputChange} className="w-full p-2 border bg-transparent border-slate-300 dark:border-slate-600 rounded-md" required/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Document Number</label>
                                <input type="text" name="documentNumber" value={newDoc.documentNumber} onChange={handleInputChange} className="w-full p-2 border bg-transparent border-slate-300 dark:border-slate-600 rounded-md" required/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Issuing Authority</label>
                                <input type="text" name="issuingAuthority" value={newDoc.issuingAuthority} onChange={handleInputChange} className="w-full p-2 border bg-transparent border-slate-300 dark:border-slate-600 rounded-md"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Issue Date</label>
                                <input type="date" value={newDoc.issueDate ? newDoc.issueDate.toISOString().split('T')[0] : ''} onChange={e => handleDateChange('issueDate', e.target.value)} className="w-full p-2 border bg-transparent border-slate-300 dark:border-slate-600 rounded-md"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Expiry Date</label>
                                <input type="date" value={newDoc.expiryDate ? newDoc.expiryDate.toISOString().split('T')[0] : ''} onChange={e => handleDateChange('expiryDate', e.target.value)} className="w-full p-2 border bg-transparent border-slate-300 dark:border-slate-600 rounded-md" required/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Cost to Renew (SAR)</label>
                                <input type="number" name="costToRenew" value={newDoc.costToRenew} onChange={handleInputChange} className="w-full p-2 border bg-transparent border-slate-300 dark:border-slate-600 rounded-md" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Renewal Frequency</label>
                                <select name="renewalFrequency" value={newDoc.renewalFrequency} onChange={handleInputChange} className="w-full p-2 border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-md">
                                    {renewalFrequencies.map(freq => <option key={freq} value={freq}>{freq}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Notes</label>
                            <textarea name="notes" value={newDoc.notes || ''} onChange={(e) => setNewDoc(prev => ({...prev, notes: e.target.value}))} rows={3} className="w-full p-2 border bg-transparent border-slate-300 dark:border-slate-600 rounded-md" />
                        </div>
                        <footer className="pt-4 flex justify-end gap-3">
                            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 font-semibold rounded-md">Cancel</button>
                            <button type="submit" className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-md">Add Document</button>
                        </footer>
                    </form>
                </main>
            </div>
        </div>
    );
};
