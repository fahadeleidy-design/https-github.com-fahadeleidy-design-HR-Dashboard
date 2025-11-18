import React, { useState } from 'react';
import { Vehicle, Driver, AddVehicleModalProps } from '../types';

const formatDateForInput = (date: Date | null): string => {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
};

export const AddVehicleModal: React.FC<AddVehicleModalProps> = ({ drivers, onClose, onAddVehicle }) => {
    const [newVehicle, setNewVehicle] = useState<Partial<Omit<Vehicle, 'id'>>>({
        plateNumber: '',
        make: '',
        model: '',
        year: new Date().getFullYear(),
        insurance: { startDate: null, endDate: null },
        inspection: { startDate: null, endDate: null },
        registration: { startDate: null, endDate: null },
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setNewVehicle(prev => ({ ...prev, [name]: type === 'number' ? parseInt(value) : value }));
    };

    const handleDocDateChange = (docType: 'insurance' | 'inspection' | 'registration', dateType: 'startDate' | 'endDate', value: string) => {
        setNewVehicle(prev => ({
            ...prev,
            [docType]: {
                ...prev[docType],
                [dateType]: value ? new Date(value) : null
            }
        }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newVehicle.plateNumber || !newVehicle.make || !newVehicle.model) {
            alert('Plate Number, Make, and Model are required.');
            return;
        }
        onAddVehicle(newVehicle as Omit<Vehicle, 'id'>);
        onClose();
    };

    const Section: React.FC<{title: string; children: React.ReactNode}> = ({title, children}) => (
        <div>
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">{title}</h3>
            {children}
        </div>
    );
    
    const EditItem: React.FC<{ label: string; name: string; value: any; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void; type?: string; required?: boolean }> = ({ label, name, value, onChange, type = 'text', required = false }) => (
        <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{label} {required && <span className="text-red-500">*</span>}</label>
            <input type={type} name={name} value={value || ''} onChange={onChange} required={required} className="w-full p-2 border bg-transparent border-slate-300 dark:border-slate-600 rounded-md"/>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold">Add New Vehicle</h2>
                </header>
                <main className="p-6 overflow-y-auto">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Section title="Vehicle Details">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <EditItem label="Plate Number" name="plateNumber" value={newVehicle.plateNumber} onChange={handleInputChange} required />
                                <EditItem label="Make" name="make" value={newVehicle.make} onChange={handleInputChange} required />
                                <EditItem label="Model" name="model" value={newVehicle.model} onChange={handleInputChange} required />
                                <EditItem label="Year" name="year" value={newVehicle.year} onChange={handleInputChange} type="number" required />
                            </div>
                        </Section>
                        <Section title="Assignment">
                             <div>
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Assign Driver</label>
                                <select name="driverId" value={newVehicle.driverId || ''} onChange={handleInputChange} className="w-full p-2 border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-md">
                                    <option value="">Unassigned</option>
                                    {drivers.map(d => <option key={d.id} value={d.id}>{d.employeeNameEnglish}</option>)}
                                </select>
                             </div>
                        </Section>
                        <Section title="Validity Dates">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                    <label className="font-semibold">Insurance</label>
                                    <EditItem label="Start Date" name="insurance.startDate" value={formatDateForInput(newVehicle.insurance?.startDate || null)} onChange={(e) => handleDocDateChange('insurance', 'startDate', e.target.value)} type="date" />
                                    <EditItem label="End Date" name="insurance.endDate" value={formatDateForInput(newVehicle.insurance?.endDate || null)} onChange={(e) => handleDocDateChange('insurance', 'endDate', e.target.value)} type="date" />
                                </div>
                                <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                    <label className="font-semibold">Inspection (Fahas)</label>
                                    <EditItem label="Start Date" name="inspection.startDate" value={formatDateForInput(newVehicle.inspection?.startDate || null)} onChange={(e) => handleDocDateChange('inspection', 'startDate', e.target.value)} type="date" />
                                    <EditItem label="End Date" name="inspection.endDate" value={formatDateForInput(newVehicle.inspection?.endDate || null)} onChange={(e) => handleDocDateChange('inspection', 'endDate', e.target.value)} type="date" />
                                </div>
                                <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                    <label className="font-semibold">Registration (Istamara)</label>
                                    <EditItem label="Start Date" name="registration.startDate" value={formatDateForInput(newVehicle.registration?.startDate || null)} onChange={(e) => handleDocDateChange('registration', 'startDate', e.target.value)} type="date" />
                                    <EditItem label="End Date" name="registration.endDate" value={formatDateForInput(newVehicle.registration?.endDate || null)} onChange={(e) => handleDocDateChange('registration', 'endDate', e.target.value)} type="date" />
                                </div>
                            </div>
                        </Section>
                         <footer className="pt-4 flex justify-end gap-3">
                            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-100 font-semibold rounded-md hover:bg-slate-300 dark:hover:bg-slate-500">Cancel</button>
                            <button type="submit" className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-md hover:bg-primary-700">Add Vehicle</button>
                        </footer>
                    </form>
                </main>
            </div>
        </div>
    );
};
