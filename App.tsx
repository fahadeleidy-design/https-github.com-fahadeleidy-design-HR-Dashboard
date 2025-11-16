import React, { useState, useMemo, useCallback } from 'react';
import { Employee, ChartDataPoint } from './types';
import { FileUpload } from './components/FileUpload';
import { StatCard } from './components/StatCard';
import { ComplianceAlerts } from './components/ComplianceAlerts';
import { NationalityChart, DepartmentChart } from './components/Charts';
import { EmployeeTable } from './components/EmployeeTable';
import { LeaveManagement } from './components/LeaveManagement';
import { EOSBCalculator } from './components/EOSBCalculator';

type Tab = 'dashboard' | 'leave' | 'eosb';

const App: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  const handleSetLoading = useCallback((isLoading: boolean, message: string = '') => {
      setLoading(isLoading);
      setLoadingMessage(message);
  }, []);

  const handleDataLoaded = useCallback((data: any[]) => {
    const mappedData: Employee[] = [];
    const skippedRows: { index: number, error: string }[] = [];

    data.forEach((row, index) => {
        try {
            const parseDate = (date: string | Date | null): Date | null => {
                if (!date) return null;
                const d = new Date(date);
                return isNaN(d.getTime()) ? null : d;
            };

            const parseSalary = (salary: any): number => {
                if (salary === null || salary === undefined) return 0;
                if (typeof salary === 'number') return salary;
                // Remove currency symbols, commas, and other non-numeric characters, then parse.
                const cleanSalary = String(salary).replace(/[^0-9.-]+/g,"");
                const num = parseFloat(cleanSalary);
                return isNaN(num) ? 0 : num;
            };
            
            const parseString = (value: any): string => {
                const str = String(value ?? '').trim();
                return str === '' ? 'N/A' : str;
            };

            const nationality = String(row.Nationality ?? '').trim();
            const isSaudi = nationality.toLowerCase().includes('saudi');

            const employee: Employee = {
              employeeId: String(row['Employee ID'] ?? ''),
              employeeNameArabic: parseString(row['Employee Name (Arabic)']),
              employeeNameEnglish: String(row['Employee Name (English)'] ?? ''),
              nationality: nationality || 'N/A',
              department: parseString(row.Department),
              jobTitle: parseString(row['Position/Job Title']),
              status: parseString(row.Status),
              dateOfJoining: parseDate(row['Date of Joining']),
              
              // Saudi-specific logic for Iqama
              iqamaNumber: isSaudi ? 'N/A' : parseString(row['IQAMA Number']),
              iqamaIssueDate: isSaudi ? null : parseDate(row['IQAMA Issue Date']),
              iqamaExpiryDate: isSaudi ? null : parseDate(row['IQAMA Expiry Date']),
              
              passportNumber: parseString(row['Passport Number']),
              passportIssueDate: parseDate(row['Passport Issue Date']),
              passportExpiryDate: parseDate(row['Passport Expiry Date']),
              contractType: parseString(row['Contract Type']),
              contractStartDate: parseDate(row['Contract Start Date']),
              contractEndDate: parseDate(row['Contract End Date']),
              email: parseString(row['Email Address']),
              mobileNumber: parseString(row['Mobile Number']),
              sponsorName: parseString(row['Sponsor Name']),
              basicSalary: parseSalary(row['Basic Salary']),
            };
            
            // Validate essential fields for each row
            if (!employee.employeeId || !employee.employeeNameEnglish) {
              throw new Error('Missing essential fields: Employee ID or Name.');
            }
            
            mappedData.push(employee);

        } catch (e: any) {
            // Excel row numbers are 1-based, plus a header row, so add 2.
            skippedRows.push({ index: index + 2, error: e.message });
        }
    });

    if (mappedData.length === 0 && data.length > 0) {
        setError('Could not read any valid employee records from the file. Please check the column headers and data format.');
        setEmployees([]);
    } else {
        setEmployees(mappedData);
        if (skippedRows.length > 0) {
            setError(`Warning: Successfully loaded ${mappedData.length} records, but skipped ${skippedRows.length} rows due to formatting errors.`);
        } else {
            setError(null); // Clear previous errors
        }
    }
  }, []);

  const dashboardStats = useMemo(() => {
    const totalEmployees = employees.length;
    if (totalEmployees === 0) {
      return {
        totalEmployees: 0,
        saudiCount: 0,
        nonSaudiCount: 0,
        saudizationRate: '0.00%',
        nationalityDistribution: [],
        departmentDistribution: []
      };
    }

    const saudiCount = employees.filter(e => e.nationality.toLowerCase().includes('saudi')).length;
    const nonSaudiCount = totalEmployees - saudiCount;
    const saudizationRate = totalEmployees > 0 ? ((saudiCount / totalEmployees) * 100).toFixed(2) + '%' : '0.00%';

    const nationalityCounts = employees.reduce<Record<string, number>>((acc, e) => {
      acc[e.nationality] = (acc[e.nationality] || 0) + 1;
      return acc;
    }, {});

    const nationalityDistribution: ChartDataPoint[] = Object.keys(nationalityCounts)
      .map((name) => ({ name, value: nationalityCounts[name] }))
      .sort((a, b) => b.value - a.value);

    const departmentCounts = employees.reduce<Record<string, number>>((acc, e) => {
      acc[e.department] = (acc[e.department] || 0) + 1;
      return acc;
    }, {});

    const departmentDistribution: ChartDataPoint[] = Object.keys(departmentCounts)
      .map((name) => ({ name, value: departmentCounts[name] }))
      .sort((a, b) => b.value - a.value);

    return {
      totalEmployees,
      saudiCount,
      nonSaudiCount,
      saudizationRate,
      nationalityDistribution,
      departmentDistribution
    };
  }, [employees]);
  
  const TabButton: React.FC<{tab: Tab, label: string, icon: React.ReactNode}> = ({ tab, label, icon }) => (
    <button
        onClick={() => setActiveTab(tab)}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
            activeTab === tab 
            ? 'bg-blue-600 text-white' 
            : 'text-slate-600 hover:bg-blue-100 hover:text-blue-700'
        }`}
    >
        {icon}
        {label}
    </button>
  );

  const WelcomePlaceholder: React.FC = () => (
    <div className="text-center p-10 bg-white rounded-xl shadow-md border border-slate-200">
      <h2 className="text-2xl font-bold text-slate-800">Welcome to the HR & Admin Module</h2>
      <p className="mt-2 text-slate-500">
        To get started, please upload your employee data using the panel above.
      </p>
       <div className="mt-6 text-left max-w-2xl mx-auto bg-slate-50 p-4 rounded-lg">
        <h3 className="font-semibold text-slate-700">How it works:</h3>
        <ol className="list-decimal list-inside mt-2 space-y-1 text-sm text-slate-600">
            <li>Prepare your employee data in an Excel file (.xlsx).</li>
            <li>Ensure your file has the required columns shown in the upload panel.</li>
            <li>Click "Select Excel File" and choose your file.</li>
            <li>The dashboard and other modules will automatically update with your data.</li>
        </ol>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header>
            <h1 className="text-3xl font-bold text-slate-900">HR & Admin Module</h1>
            <p className="text-slate-500 mt-1">Kingdom of Saudi Arabia</p>
        </header>

        <FileUpload onDataLoaded={handleDataLoaded} setLoading={handleSetLoading} setError={setError} />
        
        {loading && <div className="text-center p-4 font-semibold text-blue-600">{loadingMessage || 'Loading...'}</div>}
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">{error}</div>}
        
        {employees.length === 0 && !loading ? <WelcomePlaceholder /> : (
            <>
                <div className="bg-white p-2 rounded-xl shadow-md border border-slate-200 flex items-center justify-start space-x-2">
                    <TabButton tab="dashboard" label="Dashboard" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>} />
                    <TabButton tab="leave" label="Leave Management" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>} />
                    <TabButton tab="eosb" label="EOSB Calculator" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V4zM8 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1H9a1 1 0 01-1-1V4zM15 3a1 1 0 00-1 1v12a1 1 0 001 1h2a1 1 0 001-1V4a1 1 0 00-1-1h-2z" /></svg>} />
                </div>

                {activeTab === 'dashboard' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard title="Total Employees" value={dashboardStats.totalEmployees} color="bg-blue-100 text-blue-600" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} />
                        <StatCard title="Saudi Nationals" value={dashboardStats.saudiCount} color="bg-green-100 text-green-600" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
                        <StatCard title="Non-Saudi" value={dashboardStats.nonSaudiCount} color="bg-yellow-100 text-yellow-600" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>} />
                        <StatCard title="Saudization Rate" value={dashboardStats.saudizationRate} color="bg-indigo-100 text-indigo-600" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14v6m-3-3h6M3 10h2a2 2 0 012 2v6a2 2 0 01-2 2H3v-8zm6 0h2a2 2 0 012 2v6a2 2 0 01-2 2H9v-8zm6 0h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v-8z" /></svg>} />
                    </div>
                    <ComplianceAlerts employees={employees} />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <NationalityChart data={dashboardStats.nationalityDistribution} />
                        <DepartmentChart data={dashboardStats.departmentDistribution} />
                    </div>
                    <EmployeeTable employees={employees} />
                  </div>
                )}

                {activeTab === 'leave' && <LeaveManagement employees={employees} />}
                {activeTab === 'eosb' && <EOSBCalculator employees={employees} />}
            </>
        )}
      </div>
    </div>
  );
};

export default App;