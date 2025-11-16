import React, { useState, useMemo } from 'react';
import { Employee } from '../types';

interface EmployeeTableProps {
  employees: Employee[];
}

type SortKey = keyof Employee;
type SortOrder = 'asc' | 'desc';

const daysUntil = (date: Date | null): number => {
    if (!date) return Infinity;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0,0,0,0);
    const diffTime = targetDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-CA');
};

const getDateUrgencyClass = (date: Date | null, options?: { contractType?: string }): string => {
    // If contractType is provided, only apply highlighting for non-indefinite contracts.
    if (options?.contractType && String(options.contractType).toLowerCase().includes('indefinite')) {
        return '';
    }
    const days = daysUntil(date);
    if (days < 0) return 'bg-red-100 text-red-800 font-semibold';
    if (days <= 30) return 'bg-red-100 text-red-700 font-medium';
    if (days <= 90) return 'bg-yellow-100 text-yellow-700 font-medium';
    return '';
};

export const EmployeeTable: React.FC<EmployeeTableProps> = ({ employees }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSponsor, setSelectedSponsor] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; order: SortOrder } | null>({ key: 'employeeNameEnglish', order: 'asc'});

    const headers: { key: SortKey; label: string }[] = [
    { key: 'employeeId', label: 'ID' },
    { key: 'employeeNameEnglish', label: 'Full Name' },
    { key: 'employeeNameArabic', label: 'Name (Arabic)' },
    { key: 'department', label: 'Department' },
    { key: 'status', label: 'Status' },
    { key: 'contractType', label: 'Contract Type' },
    { key: 'iqamaExpiryDate', label: 'Iqama Expiry' },
    { key: 'passportExpiryDate', label: 'Passport Expiry' },
    { key: 'contractEndDate', label: 'Contract End' },
  ];
  
  const sponsors = useMemo(() => {
    const uniqueSponsors = [...new Set(employees.map(e => e.sponsorName).filter(Boolean))];
    return uniqueSponsors.sort();
  }, [employees]);

  const sortedEmployees = useMemo(() => {
    let sortableItems = [...employees];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        
        // Handle date sorting explicitly
        if (['iqamaExpiryDate', 'passportExpiryDate', 'contractEndDate', 'dateOfJoining'].includes(sortConfig.key)) {
            const dateA = new Date(valA as any).getTime();
            const dateB = new Date(valB as any).getTime();
            if (dateA < dateB) return sortConfig.order === 'asc' ? -1 : 1;
            if (dateA > dateB) return sortConfig.order === 'asc' ? 1 : -1;
            return 0;
        }

        if (valA < valB) return sortConfig.order === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.order === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [employees, sortConfig]);
  
  const filteredEmployees = useMemo(() => {
    return sortedEmployees.filter(employee => {
        const matchesSponsor = !selectedSponsor || employee.sponsorName === selectedSponsor;
        const matchesSearch = Object.values(employee).some(value =>
            String(value).toLowerCase().includes(searchTerm.toLowerCase())
        );
        return matchesSponsor && matchesSearch;
    });
  }, [sortedEmployees, searchTerm, selectedSponsor]);

  const requestSort = (key: SortKey) => {
    let order: SortOrder = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.order === 'asc') {
      order = 'desc';
    }
    setSortConfig({ key, order });
  };
  
  const getSortIndicator = (key: SortKey) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.order === 'asc' ? '▲' : '▼';
  };

  const handleExportCSV = () => {
    if (filteredEmployees.length === 0) {
      alert("No data to export.");
      return;
    }

    const escapeCSV = (value: any) => {
      if (value === null || value === undefined) return '';
      if (value instanceof Date) return formatDate(value);
      
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };
    
    const csvHeaders = headers.map(h => h.label).join(',');
    const csvRows = filteredEmployees.map(emp => {
      return headers.map(header => escapeCSV(emp[header.key])).join(',');
    });

    const csvContent = [csvHeaders, ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      const today = new Date().toISOString().split('T')[0];
      link.setAttribute('href', url);
      link.setAttribute('download', `employee_data_${today}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };


  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
        <h2 className="text-xl font-bold text-slate-800">Employee Directory</h2>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
             <div className="flex justify-start sm:justify-end items-center gap-3 text-xs text-slate-500">
                <span className="font-semibold">Legend:</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-100 border border-red-300"></span> Critical (&le;30d)</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-yellow-100 border border-yellow-400"></span> Warning (&le;90d)</span>
            </div>
            <div className="flex items-center gap-2">
                <select
                    value={selectedSponsor}
                    onChange={(e) => setSelectedSponsor(e.target.value)}
                    className="p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition w-full sm:w-auto"
                >
                    <option value="">All Sponsors</option>
                    {sponsors.map(sponsor => (
                        <option key={sponsor} value={sponsor}>{sponsor}</option>
                    ))}
                </select>
                <input
                type="text"
                placeholder="Search employees..."
                className="p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition w-full sm:w-auto"
                onChange={(e) => setSearchTerm(e.target.value)}
                />
                 <button 
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 bg-slate-600 text-white font-bold py-2 px-4 rounded-md hover:bg-slate-700 transition-colors"
                    aria-label="Export data to CSV"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export CSV
                </button>
            </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-500">
          <thead className="text-xs text-slate-700 uppercase bg-slate-100">
            <tr>
              {headers.map(({ key, label }) => (
                <th key={key} scope="col" className="px-6 py-3 cursor-pointer whitespace-nowrap" onClick={() => requestSort(key)}>
                  {label} {getSortIndicator(key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map((emp) => (
              <tr key={emp.employeeId} className="bg-white border-b hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-900">{emp.employeeId}</td>
                <td className="px-6 py-4 font-semibold text-slate-800 whitespace-nowrap">{emp.employeeNameEnglish}</td>
                <td className="px-6 py-4 font-semibold text-slate-800 whitespace-nowrap text-right" dir="rtl">{emp.employeeNameArabic}</td>
                <td className="px-6 py-4 whitespace-nowrap">{emp.department}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${String(emp.status).toLowerCase() === 'active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                    {emp.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${!String(emp.contractType).toLowerCase().includes('indefinite') ? 'bg-blue-100 text-blue-800' : 'bg-indigo-100 text-indigo-800'}`}>
                    {emp.contractType}
                  </span>
                </td>
                <td className={`px-6 py-4 ${getDateUrgencyClass(emp.iqamaExpiryDate)}`}>
                    {formatDate(emp.iqamaExpiryDate)}
                    {daysUntil(emp.iqamaExpiryDate) < 0 && ' (Expired)'}
                </td>
                 <td className={`px-6 py-4 ${getDateUrgencyClass(emp.passportExpiryDate)}`}>
                    {formatDate(emp.passportExpiryDate)}
                    {daysUntil(emp.passportExpiryDate) < 0 && ' (Expired)'}
                </td>
                 <td className={`px-6 py-4 ${getDateUrgencyClass(emp.contractEndDate, { contractType: emp.contractType })}`}>
                    {formatDate(emp.contractEndDate)}
                    {!String(emp.contractType).toLowerCase().includes('indefinite') && daysUntil(emp.contractEndDate) < 0 && ' (Expired)'}
                </td>
              </tr>
            ))}
             {filteredEmployees.length === 0 && (
                <tr>
                    <td colSpan={headers.length} className="text-center py-10 text-slate-500">
                        No employees found matching your filters.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};