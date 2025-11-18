import React, { useState, useEffect } from 'react';
import { Vehicle, Driver, VehicleDetailModalProps } from '../types';

const formatDateForInput = (date: Date | null): string => {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
};

const formatDate = (date: Date | null): string => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-CA');
};

export const VehicleDetailModal: React.FC<VehicleDetailModalProps> = ({ vehicle, drivers, onClose, onUpdateVehicle, onDeleteVehicle }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedVehicle, setEditedVehicle] = useState<Vehicle>(vehicle);

    useEffect(() => {
        setEditedVehicle(vehicle);
    }, [vehicle]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setEditedVehicle(prev => ({ ...prev, [name]: type === 'number' ? parseInt(value) : value }));
    };

    const handleDocDateChange = (docType: 'insurance' | 'inspection' | 'registration', dateType: 'startDate' | 'endDate', value: string) => {
        setEditedVehicle(prev => ({
            ...prev,
            [docType]: {
                ...prev[docType],
                [dateType]: value ? new Date(value) : null
            }
        }));
    };
    
    const handleSave = () => {
        onUpdateVehicle(editedVehicle);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditedVehicle(vehicle);
        setIsEditing(false);
    };

    const handleDelete = () => {
        if (window.confirm(`Are you sure you want to delete vehicle ${vehicle.plateNumber}? This action cannot be undone.`)) {
            onDeleteVehicle(vehicle.id);
            onClose();
        }
    };
    
    const driverName = drivers.find(d => d.id === vehicle.driverId)?.employeeNameEnglish || <span className="text-slate-400">Unassigned</span>;

    const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
        <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
            <p className="text-md font-semibold">{value || 'N/A'}</p>
        </div>
    );
    
    const EditItem: React.FC<{ label: string; name: string; value: any; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void; type?: string; required?: boolean }> = ({ label, name, value, onChange, type = 'text', required = false }) => (
        <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{label} {required && <span className="text-red-500">*</span>}</label>
            <input type={type} name={name} value={value || ''} onChange={onChange} required={required} className="w-full p-2 border bg-transparent border-slate-300 dark:border-slate-600 rounded-md"/>
        </div>
    );
    
    const Section: React.FC<{title: string; children: React.ReactNode}> = ({title, children}) => (
        <div>
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">{title}</h3>
            {children}
        </div>
    );

    return (
         <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold">{isEditing ? `Editing Vehicle: ${vehicle.plateNumber}` : `Vehicle: ${vehicle.plateNumber}`}</h2>
                    <div>
                        {isEditing ? (
                            <>
                                <button onClick={handleDelete} className="text-sm font-semibold text-red-600 mr-4">Delete</button>
                                <button onClick={handleCancel} className="text-sm font-semibold text-slate-600 mr-4">Cancel</button>
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
                <main className="p-6 overflow-y-auto">
                    {isEditing ? (
                        <div className="space-y-6">
                           <Section title="Vehicle Details">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <EditItem label="Plate Number" name="plateNumber" value={editedVehicle.plateNumber} onChange={handleInputChange} required />
                                    <EditItem label="Make" name="make" value={editedVehicle.make} onChange={handleInputChange} required />
                                    <EditItem label="Model" name="model" value={editedVehicle.model} onChange={handleInputChange} required />
                                    <EditItem label="Year" name="year" value={editedVehicle.year} onChange={handleInputChange} type="number" required />
                                </div>
                            </Section>
                             <Section title="Assignment">
                                 <div>
                                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Assign Driver</label>
                                    <select name="driverId" value={editedVehicle.driverId || ''} onChange={handleInputChange} className="w-full p-2 border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-md">
                                        <option value="">Unassigned</option>
                                        {drivers.map(d => <option key={d.id} value={d.id}>{d.employeeNameEnglish}</option>)}
                                    </select>
                                 </div>
                            </Section>
                            <Section title="Validity Dates">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                        <label className="font-semibold">Insurance</label>
                                        <EditItem label="Start Date" name="insurance.startDate" value={formatDateForInput(editedVehicle.insurance?.startDate || null)} onChange={(e) => handleDocDateChange('insurance', 'startDate', e.target.value)} type="date" />
                                        <EditItem label="End Date" name="insurance.endDate" value={formatDateForInput(editedVehicle.insurance?.endDate || null)} onChange={(e) => handleDocDateChange('insurance', 'endDate', e.target.value)} type="date" />
                                    </div>
                                    <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                        <label className="font-semibold">Inspection (Fahas)</label>
                                        <EditItem label="Start Date" name="inspection.startDate" value={formatDateForInput(editedVehicle.inspection?.startDate || null)} onChange={(e) => handleDocDateChange('inspection', 'startDate', e.target.value)} type="date" />
                                        <EditItem label="End Date" name="inspection.endDate" value={formatDateForInput(editedVehicle.inspection?.endDate || null)} onChange={(e) => handleDocDateChange('inspection', 'endDate', e.target.value)} type="date" />
                                    </div>
                                    <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                        <label className="font-semibold">Registration (Istamara)</label>
                                        <EditItem label="Start Date" name="registration.startDate" value={formatDateForInput(editedVehicle.registration?.startDate || null)} onChange={(e) => handleDocDateChange('registration', 'startDate', e.target.value)} type="date" />
                                        <EditItem label="End Date" name="registration.endDate" value={formatDateForInput(editedVehicle.registration?.endDate || null)} onChange={(e) => handleDocDateChange('registration', 'endDate', e.target.value)} type="date" />
                                    </div>
                                </div>
                            </Section>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <Section title="Vehicle Details">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <DetailItem label="Plate Number" value={vehicle.plateNumber} />
                                    <DetailItem label="Make" value={vehicle.make} />
                                    <DetailItem label="Model" value={vehicle.model} />
                                    <DetailItem label="Year" value={vehicle.year} />
                                </div>
                            </Section>
                            <Section title="Assignment">
                                <DetailItem label="Assigned Driver" value={driverName} />
                            </Section>
                            <Section title="Validity Dates">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                        <h4 className="font-semibold mb-2">Insurance</h4>
                                        <DetailItem label="Start Date" value={formatDate(vehicle.insurance.startDate)} />
                                        <DetailItem label="End Date" value={formatDate(vehicle.insurance.endDate)} />
                                    </div>
                                    <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                        <h4 className="font-semibold mb-2">Inspection (Fahas)</h4>
                                        <DetailItem label="Start Date" value={formatDate(vehicle.inspection.startDate)} />
                                        <DetailItem label="End Date" value={formatDate(vehicle.inspection.endDate)} />
                                    </div>
                                    <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                        <h4 className="font-semibold mb-2">Registration (Istamara)</h4>
                                        <DetailItem label="Start Date" value={formatDate(vehicle.registration.startDate)} />
                                        <DetailItem label="End Date" value={formatDate(vehicle.registration.endDate)} />
                                    </div>
                                </div>
                            </Section>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};
