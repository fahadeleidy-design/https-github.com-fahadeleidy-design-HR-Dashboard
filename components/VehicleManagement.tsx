import React, { useState, useMemo } from 'react';
import { Vehicle, Driver, VehicleManagementProps } from '../types';
import { AddVehicleModal } from './AddVehicleModal';
import { VehicleDetailModal } from './VehicleDetailModal';

type SortKey = keyof Vehicle | 'driverName';
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

const getStatusBadge = (endDate: Date | null) => {
    const days = daysUntil(endDate);
    if (days < 0) {
        return <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-200 dark:bg-red-900/50 dark:text-red-300 rounded-full">Expired</span>;
    }
    if (days <= 30) {
        return <span className="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 rounded-full">Expires Soon</span>;
    }
    return <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-200 dark:bg-green-900/50 dark:text-green-300 rounded-full">Valid</span>;
};

export const VehicleManagement: React.FC<VehicleManagementProps> = ({ vehicles, drivers, onAddVehicle, onUpdateVehicle, onDeleteVehicle }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; order: SortOrder }>({ key: 'plateNumber', order: 'asc' });
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const driverMap = useMemo(() => new Map(drivers.map(d => [d.employeeId, d.employeeNameEnglish])), [drivers]);

    const sortedAndFilteredVehicles = useMemo(() => {
        let items = [...vehicles];

        if (searchTerm) {
            const lowercasedFilter = searchTerm.toLowerCase();
            items = items.filter(v =>
                v.plateNumber.toLowerCase().includes(lowercasedFilter) ||
                v.make.toLowerCase().includes(lowercasedFilter) ||
                v.model.toLowerCase().includes(lowercasedFilter) ||
                (v.driverId && driverMap.get(v.driverId)?.toLowerCase().includes(lowercasedFilter))
            );
        }

        items.sort((a, b) => {
            const key = sortConfig.key;
            const order = sortConfig.order;
            
            let valA: any;
            let valB: any;
            
            if (key === 'driverName') {
                valA = a.driverId ? driverMap.get(a.driverId) : '';
                valB = b.driverId ? driverMap.get(b.driverId) : '';
            } else {
                valA = a[key as keyof Vehicle];
                valB = b[key as keyof Vehicle];
            }
            
            if (valA === null || valA === undefined) return 1;
            if (valB === null || valB === undefined) return -1;
            
            let comparison = 0;
            if (typeof valA === 'number' && typeof valB === 'number') {
                comparison = valA - valB;
            } else {
                comparison = String(valA).toLowerCase().localeCompare(String(valB).toLowerCase());
            }
            return order === 'asc' ? comparison : -comparison;
        });

        return items;
    }, [vehicles, searchTerm, sortConfig, driverMap]);
    
    const requestSort = (key: SortKey) => {
        const order = (sortConfig.key === key && sortConfig.order === 'asc') ? 'desc' : 'asc';
        setSortConfig({ key, order });
    };

    const exportToCsv = () => {
        const filename = `vehicle_fleet_data_${new Date().toISOString().split('T')[0]}.csv`;
        const headers = ["Plate Number", "Make", "Model", "Year", "Assigned Driver", "Insurance Expiry", "Inspection Expiry", "Registration Expiry"];
        
        const data = sortedAndFilteredVehicles.map(v => [
            v.plateNumber, v.make, v.model, v.year,
            v.driverId ? driverMap.get(v.driverId) : 'Unassigned',
            formatDate(v.insurance.endDate),
            formatDate(v.inspection.endDate),
            formatDate(v.registration.endDate)
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
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Vehicle Fleet Management</h2>
                    <div className="flex items-center gap-2">
                        <button onClick={exportToCsv} className="flex items-center justify-center gap-2 bg-slate-600 dark:bg-slate-700 text-white font-semibold py-2 px-4 rounded-md hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors text-sm">
                           Export
                        </button>
                         <button onClick={() => setIsAddModalOpen(true)} className="flex items-center justify-center gap-2 bg-primary-600 text-white font-bold py-2 px-4 rounded-md hover:bg-primary-700 transition-colors text-sm">
                            Add Vehicle
                        </button>
                    </div>
                </div>
                <input
                    type="text"
                    placeholder="Search by plate, make, model, or driver..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 mb-4 border bg-transparent border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-primary-500 transition"
                />
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                        <thead className="text-xs text-slate-700 dark:text-slate-300 uppercase bg-slate-100 dark:bg-slate-700">
                            <tr>
                                {[{key: 'plateNumber', label: 'Plate'}, {key: 'make', label: 'Make & Model'}, {key: 'driverName', label: 'Driver'}, {key: 'insurance', label: 'Insurance'}, {key: 'inspection', label: 'Inspection'}, {key: 'registration', label: 'Registration'}].map(({key, label}) => (
                                    <th key={key} scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestSort(key as SortKey)}>
                                        {label} {sortConfig.key === key ? (sortConfig.order === 'asc' ? '▲' : '▼') : ''}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {sortedAndFilteredVehicles.map(v => (
                                <tr key={v.id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer" onClick={() => setSelectedVehicle(v)}>
                                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{v.plateNumber}</td>
                                    <td className="px-6 py-4">{v.make} {v.model} ({v.year})</td>
                                    <td className="px-6 py-4">{v.driverId ? driverMap.get(v.driverId) : <span className="text-slate-400">Unassigned</span>}</td>
                                    <td className="px-6 py-4">{getStatusBadge(v.insurance.endDate)}</td>
                                    <td className="px-6 py-4">{getStatusBadge(v.inspection.endDate)}</td>
                                    <td className="px-6 py-4">{getStatusBadge(v.registration.endDate)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {isAddModalOpen && <AddVehicleModal drivers={drivers} onClose={() => setIsAddModalOpen(false)} onAddVehicle={onAddVehicle} />}
            {selectedVehicle && <VehicleDetailModal vehicle={selectedVehicle} drivers={drivers} onClose={() => setSelectedVehicle(null)} onUpdateVehicle={onUpdateVehicle} onDeleteVehicle={onDeleteVehicle} />}
        </>
    );
};
