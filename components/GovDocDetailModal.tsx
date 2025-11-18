import React, { useState, useEffect } from 'react';
import { GovernmentalDocument, GovDocDetailModalProps } from '../types';

const predefinedDocTypes = [
    "Commercial Registration (CR)", "Municipality License", "Manufacturing License", "Import/Export License", 
    "Zakat & Tax Registration (ZATCA)", "Social Security Registration (GOSI)", "Labor Office Registration", 
    "Environmental Compliance Certificate", "VAT Registration Certificate", "Chamber of Commerce Membership"
];
const renewalFrequencies = ["Annual", "Bi-annual", "Quarterly", "Every 2 Years", "Every 3 Years", "Every 5 Years", "One-time"];

const formatDate = (date: Date | null): string => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-CA');
};

export const GovDocDetailModal: React.FC<GovDocDetailModalProps> = ({ doc, onClose, onUpdateGovDoc, onDeleteGovDoc }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedDoc, setEditedDoc] = useState<GovernmentalDocument>(doc);

    useEffect(() => {
        setEditedDoc(doc);
    }, [doc]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setEditedDoc(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).type === 'number' ? parseFloat(value) : value }));
    };

    const handleDateChange = (name: 'issueDate' | 'expiryDate', value: string) => {
        setEditedDoc(prev => ({ ...prev, [name]: value ? new Date(value) : null }));
    };
    
    const handleSave = () => {
        onUpdateGovDoc(editedDoc);
        setIsEditing(false);
    };

    const handleDelete = () => {
        if (window.confirm(`Are you sure you want to delete "${doc.documentName}"? This action cannot be undone.`)) {
            onDeleteGovDoc(doc.id);
            onClose();
        }
    };

    const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
        <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
            <p className="text-md font-semibold">{value || 'N/A'}</p>
        </div>
    );
    
    return (
         <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold">{isEditing ? `Editing: ${doc.documentName}` : doc.documentName}</h2>
                    <div>
                        {isEditing ? (
                            <>
                                <button onClick={handleDelete} className="text-sm font-semibold text-red-600 mr-4">Delete</button>
                                <button onClick={() => setIsEditing(false)} className="text-sm font-semibold text-slate-600 mr-4">Cancel</button>
                                <button onClick={handleSave} className="text-sm font-semibold bg-primary-600 text-white px-4 py-2 rounded-md">Save</button>
                            </>
                        ) : (
                             <>
                                <button onClick={() => setIsEditing(true)} className="text-sm font-semibold text-primary-600 mr-4">Edit</button>
                                <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                            </>
                        )}
                    </div>
                </header>
                <main className="p-6 overflow-y-auto space-y-4">
                    {isEditing ? (
                        <div className="space-y-4">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium">Document Type</label>
                                    <select name="documentType" value={editedDoc.documentType} onChange={handleInputChange} className="w-full p-2 border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-md">
                                        {predefinedDocTypes.map(type => <option key={type} value={type}>{type}</option>)}
                                        {!predefinedDocTypes.includes(editedDoc.documentType) && <option value={editedDoc.documentType}>{editedDoc.documentType}</option>}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Document Name / Description</label>
                                    <input type="text" name="documentName" value={editedDoc.documentName} onChange={handleInputChange} className="w-full p-2 border bg-transparent border-slate-300 dark:border-slate-600 rounded-md" required/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Document Number</label>
                                    <input type="text" name="documentNumber" value={editedDoc.documentNumber} onChange={handleInputChange} className="w-full p-2 border bg-transparent border-slate-300 dark:border-slate-600 rounded-md" required/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Issuing Authority</label>
                                    <input type="text" name="issuingAuthority" value={editedDoc.issuingAuthority} onChange={handleInputChange} className="w-full p-2 border bg-transparent border-slate-300 dark:border-slate-600 rounded-md"/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Issue Date</label>
                                    <input type="date" value={editedDoc.issueDate ? editedDoc.issueDate.toISOString().split('T')[0] : ''} onChange={e => handleDateChange('issueDate', e.target.value)} className="w-full p-2 border bg-transparent border-slate-300 dark:border-slate-600 rounded-md"/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Expiry Date</label>
                                    <input type="date" value={editedDoc.expiryDate ? editedDoc.expiryDate.toISOString().split('T')[0] : ''} onChange={e => handleDateChange('expiryDate', e.target.value)} className="w-full p-2 border bg-transparent border-slate-300 dark:border-slate-600 rounded-md" required/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Cost to Renew (SAR)</label>
                                    <input type="number" name="costToRenew" value={editedDoc.costToRenew} onChange={handleInputChange} className="w-full p-2 border bg-transparent border-slate-300 dark:border-slate-600 rounded-md" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Renewal Frequency</label>
                                    <select name="renewalFrequency" value={editedDoc.renewalFrequency} onChange={handleInputChange} className="w-full p-2 border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-md">
                                        {renewalFrequencies.map(freq => <option key={freq} value={freq}>{freq}</option>)}
                                    </select>
                                </div>
                           </div>
                           <div>
                                <label className="block text-sm font-medium">Notes</label>
                                <textarea name="notes" value={editedDoc.notes || ''} onChange={handleInputChange} rows={3} className="w-full p-2 border bg-transparent border-slate-300 dark:border-slate-600 rounded-md" />
                           </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
                            <DetailItem label="Document Type" value={doc.documentType} />
                            <DetailItem label="Document Number" value={doc.documentNumber} />
                            <DetailItem label="Issuing Authority" value={doc.issuingAuthority} />
                            <DetailItem label="Issue Date" value={formatDate(doc.issueDate)} />
                            <DetailItem label="Expiry Date" value={formatDate(doc.expiryDate)} />
                            <DetailItem label="Cost to Renew" value={`SAR ${doc.costToRenew.toLocaleString()}`} />
                            <DetailItem label="Renewal Frequency" value={doc.renewalFrequency} />
                            <div className="col-span-full">
                                <DetailItem label="Notes" value={<p className="whitespace-pre-wrap text-sm">{doc.notes || 'N/A'}</p>} />
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};
