import React, { useState, useMemo, useEffect } from 'react';
import { Employee, EmployeeTableProps } from '../types';
import { EmployeeDetailModal } from './EmployeeDetailModal';
import { AddEmployeeModal } from './AddEmployeeModal';

type SortKey = keyof Employee | 'iqamaExpiryDate' | 'contractEndDate' | 'contractType';
type SortOrder = 'asc' | 'desc';
const ITEMS_PER_PAGE = 15;

const formatDate = (date: Date | null): string => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-CA');
};

const daysUntil = (date: Date | null): number => {
    if (!date) return Infinity;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0,0,0,0);
    const diffTime = targetDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const getDateUrgencyClass = (date: Date | null, isIndefiniteContract: boolean): string => {
    if (isIndefiniteContract) return '';
    const days = daysUntil(date);
    if (days < 0) return 'bg-red-200 dark:bg-red-900/50 text-red-800 dark:text-red-300 font-semibold';
    if (days <= 30) return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-medium';
    if (days <= 90) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 font-medium';
    return 'dark:text-slate-300';
};

const DateRangePicker: React.FC<{
  label: string;
  range: { from: string; to: string };
  setRange: React.Dispatch<React.SetStateAction<{ from: string; to: string }>>;
  onFilterChange: () => void;
}> = ({ label, range, setRange, onFilterChange }) => {
  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRange(prev => ({ ...prev, from: e.target.value }));
    onFilterChange();
  };
  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRange(prev => ({ ...prev, to: e.target.value }));
    onFilterChange();
  };
  const clearRange = () => {
    if (range.from || range.to) {
      setRange({ from: '', to: '' });
      onFilterChange();
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{label}</label>
      <div className="flex items-center gap-1">
        <input type="date" value={range.from} onChange={handleFromChange} className="p-2 border bg-transparent border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-primary-500 transition w-full text-sm" />
        <span className="text-slate-500 dark:text-slate-400">-</span>
        <input type="date" value={range.to} onChange={handleToChange} className="p-2 border bg-transparent border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-primary-500 transition w-full text-sm" />
        <button onClick={clearRange} className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed" aria-label={`Clear ${label} filter`} disabled={!range.from && !range.to}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export const EmployeeTable: React.FC<EmployeeTableProps> = ({ employees, onUpdateEmployee, onAddEmployee, onDeleteEmployee, initialFilter, onFilterApplied }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; order: SortOrder }>({ key: 'employeeNameEnglish', order: 'asc'});
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [nationalityFilter, setNationalityFilter] = useState('');
  const [contractTypeFilter, setContractTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [joiningDateRange, setJoiningDateRange] = useState<{ from: string; to: string }>({ from: '', to: '' });
  const [iqamaExpiryRange, setIqamaExpiryRange] = useState<{ from: string; to: string }>({ from: '', to: '' });
  const [contractEndRange, setContractEndRange] = useState<{ from: string; to: string }>({ from: '', to: '' });
  
  const resetAllFilters = (excludeInitial: boolean = false) => {
    setSearchTerm('');
    setDepartmentFilter('');
    setNationalityFilter('');
    setContractTypeFilter('');
    setJoiningDateRange({ from: '', to: '' });
    setIqamaExpiryRange({ from: '', to: '' });
    setContractEndRange({ from: '', to: '' });
    setCurrentPage(1);
  };

  const uniqueNationalities = useMemo(() => [...new Set(employees.map(e => e.nationality))].sort(), [employees]);

  useEffect(() => {
    if (initialFilter) {
      resetAllFilters(true);
      const today = new Date();
      switch(initialFilter.type) {
        case 'SAUDI_NATIONALS':
          const saudiNationality = uniqueNationalities.find(n => n.toLowerCase().includes('saudi') || n.toLowerCase().includes('سعودي'));
          if (saudiNationality) {
            setNationalityFilter(saudiNationality);
          }
          break;
        case 'IQAMA_EXPIRY_THIS_MONTH':
          const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          setIqamaExpiryRange({ from: formatDate(startOfMonth), to: formatDate(endOfMonth) });
          break;
        case 'IQAMA_EXPIRY_NEXT_MONTH':
          const startOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
          const endOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);
          setIqamaExpiryRange({ from: formatDate(startOfNextMonth), to: formatDate(endOfNextMonth) });
          break;
        case 'CONTRACT_EXPIRY_60_70_DAYS':
          const dateIn60Days = new Date();
          dateIn60Days.setDate(today.getDate() + 60);
          const dateIn70Days = new Date();
          dateIn70Days.setDate(today.getDate() + 70);
          setContractEndRange({ from: formatDate(dateIn60Days), to: formatDate(dateIn70Days) });
          break;
      }
      onFilterApplied();
    }
  }, [initialFilter, onFilterApplied, uniqueNationalities]);


  const headers: { key: SortKey; label: string }[] = [
    { key: 'employeeId', label: 'ID' },
    { key: 'employeeNameEnglish', label: 'Full Name' },
    { key: 'employeeNameArabic', label: 'Name (Arabic)' },
    { key: 'department', label: 'Department' },
    { key: 'contractType', label: 'Contract' },
    { key: 'iqamaExpiryDate', label: 'Iqama Expiry' },
    { key: 'contractEndDate', label: 'Contract End' },
  ];
  
  const { uniqueDepartments, uniqueContractTypes } = useMemo(() => {
    const departments = [...new Set(employees.map(e => e.department))].sort();
    const contractTypes = [...new Set(employees.map(e => e.contract.contractType))].sort();
    return { uniqueDepartments: departments, uniqueContractTypes: contractTypes };
  }, [employees]);

  const filteredAndSortedEmployees = useMemo(() => {
    const checkDateRange = (date: Date | null, range: { from: string; to: string }) => {
      if (!range.from && !range.to) return true;
      if (!date) return false;
      const itemDate = new Date(date);
      itemDate.setHours(0, 0, 0, 0);

      if (range.from) {
        const fromDate = new Date(`${range.from}T00:00:00`);
        if (itemDate < fromDate) return false;
      }
      if (range.to) {
        const toDate = new Date(`${range.to}T00:00:00`);
        if (itemDate > toDate) return false;
      }
      return true;
    };

    let sortableItems = employees
      .filter(e => {
        const departmentMatch = !departmentFilter || e.department === departmentFilter;
        const contractTypeMatch = !contractTypeFilter || e.contract.contractType === contractTypeFilter;
        const nationalityMatch = !nationalityFilter || e.nationality === nationalityFilter;
        const searchMatch = !searchTerm || Object.values(e).some(value => 
            typeof value === 'object' && value !== null
            ? Object.values(value).some(subVal => String(subVal).toLowerCase().includes(searchTerm.toLowerCase()))
            : String(value).toLowerCase().includes(searchTerm.toLowerCase())
        );

        const joiningDateMatch = checkDateRange(e.dateOfJoining, joiningDateRange);
        const iqamaExpiryMatch = checkDateRange(e.visa.iqamaExpiryDate, iqamaExpiryRange);
        const contractEndMatch = checkDateRange(e.contract.endDate, contractEndRange);

        return departmentMatch && contractTypeMatch && nationalityMatch && searchMatch && joiningDateMatch && iqamaExpiryMatch && contractEndMatch;
      });

    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        const getVal = (emp: Employee, key: SortKey) => {
            switch(key) {
                case 'iqamaExpiryDate': return emp.visa.iqamaExpiryDate;
                case 'contractEndDate': return emp.contract.endDate;
                case 'contractType': return emp.contract.contractType;
                default: return emp[key as keyof Employee];
            }
        }
        const valA = getVal(a, sortConfig.key);
        const valB = getVal(b, sortConfig.key);
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        
        let comparison = 0;
        if (valA instanceof Date && valB instanceof Date) {
            comparison = valA.getTime() - valB.getTime();
        } else {
            comparison = String(valA).toLowerCase().localeCompare(String(valB).toLowerCase());
        }
        return sortConfig.order === 'asc' ? comparison : -comparison;
      });
    }
    return sortableItems;
  }, [employees, sortConfig, searchTerm, departmentFilter, contractTypeFilter, nationalityFilter, joiningDateRange, iqamaExpiryRange, contractEndRange]);

  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedEmployees.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAndSortedEmployees, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedEmployees.length / ITEMS_PER_PAGE);

  const requestSort = (key: SortKey) => {
    const order = (sortConfig.key === key && sortConfig.order === 'asc') ? 'desc' : 'asc';
    setSortConfig({ key, order });
  };
  
  const handleFilterChange = () => {
    setCurrentPage(1);
  };
  
  const exportToCsv = () => {
    const filename = `employee_data_${new Date().toISOString().split('T')[0]}.csv`;
    
    const flattenedData = filteredAndSortedEmployees.map(e => ({
        'Employee ID': e.employeeId, 'Name (English)': e.employeeNameEnglish, 'Name (Arabic)': e.employeeNameArabic,
        'Nationality': e.nationality, 'Department': e.department, 'Job Title': e.jobTitle, 'Status': e.status,
        'Date of Joining': formatDate(e.dateOfJoining), 'Sponsor': e.sponsorName, 'Contract Type': e.contract.contractType,
        'Contract Start': formatDate(e.contract.startDate), 'Contract End': formatDate(e.contract.endDate),
        'Iqama Number': e.visa.iqamaNumber, 'Iqama Expiry': formatDate(e.visa.iqamaExpiryDate), 'Passport Number': e.passportNumber,
        'GOSI Number': e.gosi.gosiNumber, 'Basic Salary': e.payroll.basicSalary, 'Housing Allowance': e.payroll.housingAllowance,
        'Transportation Allowance': e.payroll.transportationAllowance, 'Total Loan Amount': e.payroll.loanInfo?.totalAmount,
        'Loan Start Date': formatDate(e.payroll.loanInfo?.startDate || null), 'IBAN': e.iban, 'Bank Name': e.bankName
    }));
    
    if (flattenedData.length === 0) return;
    
    const headers = Object.keys(flattenedData[0]);
    const escapeCsv = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    
    const csvRows = [
        headers.join(','), 
        ...flattenedData.map(row => 
            headers.map(header => escapeCsv((row as any)[header])).join(',')
        )
    ];

    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Employee Directory</h2>
            <div className="flex items-center gap-2">
                <button onClick={exportToCsv} className="flex items-center justify-center gap-2 bg-slate-600 dark:bg-slate-700 text-white font-semibold py-2 px-4 rounded-md hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Export
                </button>
                 <button onClick={() => setIsAddModalOpen(true)} className="flex items-center justify-center gap-2 bg-primary-600 text-white font-bold py-2 px-4 rounded-md hover:bg-primary-700 transition-colors text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                    Add Employee
                </button>
            </div>
        </div>
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <input type="text" placeholder="Search..." value={searchTerm} className="p-2 border bg-transparent border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-primary-500 transition w-full" onChange={(e) => {setSearchTerm(e.target.value); handleFilterChange();}} />
                <select value={departmentFilter} onChange={(e) => {setDepartmentFilter(e.target.value); handleFilterChange();}} className="p-2 border bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-primary-500 transition w-full">
                    <option value="">All Departments</option>
                    {uniqueDepartments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                 <select value={nationalityFilter} onChange={(e) => {setNationalityFilter(e.target.value); handleFilterChange();}} className="p-2 border bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-primary-500 transition w-full">
                    <option value="">All Nationalities</option>
                    {uniqueNationalities.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <select value={contractTypeFilter} onChange={(e) => {setContractTypeFilter(e.target.value); handleFilterChange();}} className="p-2 border bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-primary-500 transition w-full">
                    <option value="">All Contract Types</option>
                    {uniqueContractTypes.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 mt-4 border-t border-slate-200 dark:border-slate-600">
                <DateRangePicker label="Joining Date" range={joiningDateRange} setRange={setJoiningDateRange} onFilterChange={handleFilterChange} />
                <DateRangePicker label="Iqama Expiry Date" range={iqamaExpiryRange} setRange={setIqamaExpiryRange} onFilterChange={handleFilterChange} />
                <DateRangePicker label="Contract End Date" range={contractEndRange} setRange={setContractEndRange} onFilterChange={handleFilterChange} />
            </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
          <thead className="text-xs text-slate-700 dark:text-slate-300 uppercase bg-slate-100 dark:bg-slate-700">
            <tr>
              {headers.map(({ key, label }) => (
                <th key={key} scope="col" className="px-6 py-3 cursor-pointer whitespace-nowrap" onClick={() => requestSort(key)}>
                  <div className="flex items-center gap-2">{label} <span className="text-slate-400">{sortConfig.key === key ? (sortConfig.order === 'asc' ? '▲' : '▼') : '↕'}</span></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedEmployees.map((emp) => (
              <tr key={emp.employeeId} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer" onClick={() => setSelectedEmployee(emp)}>
                <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{emp.employeeId}</td>
                <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">{emp.employeeNameEnglish}</td>
                <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap text-right" dir="rtl">{emp.employeeNameArabic}</td>
                <td className="px-6 py-4 whitespace-nowrap">{emp.department}</td>
                <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${String(emp.contract.contractType).toLowerCase() !== 'indefinite' ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-300' : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300'}`}>{emp.contract.contractType}</span></td>
                <td className={`px-6 py-4 ${getDateUrgencyClass(emp.visa.iqamaExpiryDate, false)}`}>{formatDate(emp.visa.iqamaExpiryDate)}</td>
                <td className={`px-6 py-4 ${getDateUrgencyClass(emp.contract.endDate, String(emp.contract.contractType).toLowerCase() === 'indefinite')}`}>{formatDate(emp.contract.endDate)}</td>
              </tr>
            ))}
             {paginatedEmployees.length === 0 && (
                <tr><td colSpan={headers.length} className="text-center py-10 text-slate-500 dark:text-slate-400">No employees found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between pt-4">
        <span className="text-sm text-slate-500 dark:text-slate-400">
          Showing {Math.min( (currentPage - 1) * ITEMS_PER_PAGE + 1, filteredAndSortedEmployees.length )}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedEmployees.length)} of {filteredAndSortedEmployees.length} records
        </span>
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 border rounded-md bg-white dark:bg-slate-700 dark:border-slate-600 disabled:opacity-50">Prev</button>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="px-3 py-1 border rounded-md bg-white dark:bg-slate-700 dark:border-slate-600 disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>
    {selectedEmployee && <EmployeeDetailModal employee={selectedEmployee} onClose={() => setSelectedEmployee(null)} onUpdateEmployee={onUpdateEmployee} onDeleteEmployee={onDeleteEmployee} />}
    {isAddModalOpen && <AddEmployeeModal onClose={() => setIsAddModalOpen(false)} onAddEmployee={onAddEmployee} />}
    </>
  );
};