import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Employee, CorrectionReport, RuleDefinition, Tab, SkippedRow, LoanInfo } from './types';
import { FileUpload } from './components/FileUpload';
import { StatCard } from './components/StatCard';
import { ComplianceAlerts } from './components/ComplianceAlerts';
import { NationalityChart, DepartmentChart, TenureChart } from './components/Charts';
import { EmployeeTable } from './components/EmployeeTable';
import { LeaveManagement } from './components/LeaveManagement';
import { EOSBCalculator } from './components/EOSBCalculator';
import { Sidebar } from './components/Sidebar';
import { correctDataWithAI, localStandardizeData } from './lib/ai';
import { CorrectionReportModal } from './components/CorrectionReportModal';
import { AskAI } from './components/AskAI';
import { Payroll } from './components/Payroll';
import { SaudizationDashboard } from './components/SaudizationDashboard';
import { StatutoryReports } from './components/StatutoryReports';
import { PersonalLoans } from './components/PersonalLoans';
import { loadRules, calculateNitaqatStatus } from './lib/rulesEngine';
import { DEFAULT_USE_AI, DISABLE_AI_OVERRIDE, AI_PROXY_ENDPOINT, AI_TIMEOUT_MS, AI_RETRIES, AI_SAMPLE_LIMIT } from './config/aiConfig';

export const App: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [selectedSponsor, setSelectedSponsor] = useState<string>('');
  const [correctionReport, setCorrectionReport] = useState<CorrectionReport | null>(null);
  const [rules, setRules] = useState<RuleDefinition[]>([]);
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr');
  const [useAIForCorrection, setUseAIForCorrection] = useState<boolean>(DEFAULT_USE_AI);
  const [initialTableFilter, setInitialTableFilter] = useState<any>(null);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = direction;
  }, [lang, direction]);

  useEffect(() => {
    try {
      setRules(loadRules());
    } catch (e) {
      console.error("Failed to load legal rules:", e);
      setError("Application configuration is corrupted. Could not load legal rules.");
    }
  }, []);

  const handleLanguageChange = (selectedLang: 'en' | 'ar') => {
    setLang(selectedLang);
    setDirection(selectedLang === 'ar' ? 'rtl' : 'ltr');
  };

  const handleSetLoading = useCallback((isLoading: boolean, message: string = '') => {
    setLoading(isLoading);
    setLoadingMessage(message);
  }, []);

  const getFieldValue = (row: any, ...keys: string[]): string => {
    for (const key of keys) {
      const value = row[key];
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        return String(value).trim();
      }
    }
    return '';
  };

  const parseDate = (dateValue: any): Date | null => {
    if (!dateValue) return null;
    if (typeof dateValue === 'number') {
      const excelEpoch = new Date(1899, 11, 30);
      const d = new Date(excelEpoch.getTime() + dateValue * 24 * 60 * 60 * 1000);
      if (!isNaN(d.getTime())) return d;
    }
    const dateStr = String(dateValue).trim();
    if (dateStr === '' || dateStr.toLowerCase() === 'n/a' || dateStr.toLowerCase() === 'na') return null;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  };
  
  const processAndMapData = useCallback((dataToProcess: any[]): { mappedData: Employee[], skippedRows: SkippedRow[] } => {
    const mappedData: Employee[] = [];
    const skippedRows: SkippedRow[] = [];

    dataToProcess.forEach((row, index) => {
      try {
        const employeeId = getFieldValue(row, 'Employee ID', 'ID_Key');
        if (!employeeId) throw new Error('Missing Employee ID.');

        const nationality = getFieldValue(row, 'Nationality', 'Qiwa_Nationality', 'GOSI_Nationality');
        const isSaudi = nationality.toLowerCase().includes('saudi') || nationality.includes('سعودي') || nationality.includes('سعودية');
        
        const dateOfJoining = parseDate(getFieldValue(row, 'Date of Joining', 'GOSI_Join_Date'));
        const tenure = dateOfJoining ? (new Date().getTime() - dateOfJoining.getTime()) / (1000 * 3600 * 24 * 365.25) : 0;

        const loanInfo: LoanInfo = {
            totalAmount: parseFloat(getFieldValue(row, 'Total Loan Amount')) || undefined,
            startDate: parseDate(getFieldValue(row, 'Loan Start Date')),
            installments: 4, // Default as per policy
        };

        const employee: Employee = {
          id: employeeId,
          employeeId,
          employeeNameEnglish: getFieldValue(row, 'Employee Name (English)', 'Qiwa_Employee_Name', 'GOSI_Name'),
          employeeNameArabic: getFieldValue(row, 'Employee Name (Arabic)'),
          nationality,
          isSaudi,
          department: getFieldValue(row, 'Department'),
          jobTitle: getFieldValue(row, 'Position/Job Title', 'Qiwa_Job_Title', 'GOSI_Job_Title'),
          email: getFieldValue(row, 'Email Address', 'Email'),
          mobileNumber: getFieldValue(row, 'Mobile Number', 'Mobile'),
          sponsorName: getFieldValue(row, 'Sponsor Name', 'Sponsor'),
          status: getFieldValue(row, 'Status') || 'Active',
          dateOfJoining,
          dateOfExit: parseDate(getFieldValue(row, 'Date of Exit')),
          tenure,
          contract: {
            contractType: getFieldValue(row, 'Contract Type') || 'indefinite',
            startDate: parseDate(getFieldValue(row, 'Contract Start Date')),
            endDate: parseDate(getFieldValue(row, 'Contract End Date')),
          },
          visa: {
            iqamaNumber: isSaudi ? 'N/A' : getFieldValue(row, 'Iqama Number'),
            iqamaIssueDate: isSaudi ? null : parseDate(getFieldValue(row, 'Iqama Issue Date')),
            iqamaExpiryDate: isSaudi ? null : parseDate(getFieldValue(row, 'Iqama Expiry Date')),
          },
          gosi: {
            registered: getFieldValue(row, 'GOSI Registered').toLowerCase() === 'yes',
            gosiNumber: getFieldValue(row, 'GOSI Number', 'GOSI ID'),
          },
          payroll: {
             basicSalary: parseFloat(getFieldValue(row, 'Basic Salary', 'GOSI_Basic_Salary')) || undefined,
             housingAllowance: parseFloat(getFieldValue(row, 'Housing Allowance', 'GOSI_Housing')) || undefined,
             transportationAllowance: parseFloat(getFieldValue(row, 'Transportation Allowance')) || undefined,
             commission: parseFloat(getFieldValue(row, 'Commission', 'GOSI_Commission')) || undefined,
             otherAllowances: parseFloat(getFieldValue(row, 'Other Allowances', 'GOSI_Other_Allowances')) || undefined,
             totalSalary: parseFloat(getFieldValue(row, 'Total Salary', 'GOSI_Total_Salary')) || undefined,
             taxableSalary: parseFloat(getFieldValue(row, 'Taxable Salary', 'GOSI_Taxable_Salary')) || undefined,
             loanInfo: (loanInfo.totalAmount && loanInfo.startDate) ? loanInfo : undefined,
          },
          passportNumber: getFieldValue(row, 'Passport Number'),
          passportIssueDate: parseDate(getFieldValue(row, 'Passport Issue Date')),
          passportExpiryDate: parseDate(getFieldValue(row, 'Passport Expiry Date')),
          iban: getFieldValue(row, 'IBAN', 'Bank IBAN'),
          bankName: getFieldValue(row, 'Bank Name'),
          specialCategory: getFieldValue(row, 'Special Category', 'Employment Type'),
        };
        mappedData.push(employee);
      } catch (e: any) {
        skippedRows.push({ rowNumber: index + 2, originalData: row, error: e.message });
      }
    });
    return { mappedData, skippedRows };
  }, []);

  const handleDataLoaded = useCallback(async (rawData: any[]) => {
    if (!rawData || rawData.length === 0) {
      setError("Uploaded file is empty.");
      return;
    }
    handleSetLoading(true, `Processing ${rawData.length} rows...`);
    setError(null);
    setCorrectionReport(null);

    let dataToProcess = rawData;
    let aiProcessingAttempted = false;

    try {
      if (useAIForCorrection && !DISABLE_AI_OVERRIDE && AI_PROXY_ENDPOINT) {
        aiProcessingAttempted = true;
        handleSetLoading(true, 'Sending data to AI for correction...');
        dataToProcess = await correctDataWithAI(rawData, {
          useAI: true,
          timeoutMs: AI_TIMEOUT_MS,
          retries: AI_RETRIES,
          sampleLimit: AI_SAMPLE_LIMIT,
          serverEndpoint: AI_PROXY_ENDPOINT,
          disableAIOverride: DISABLE_AI_OVERRIDE,
        });
      } else {
        handleSetLoading(true, 'Applying local data standardization...');
        dataToProcess = localStandardizeData(rawData);
      }
      
      handleSetLoading(true, 'Mapping processed data...');
      const { mappedData, skippedRows } = processAndMapData(dataToProcess);
      
      setEmployees(mappedData);
      setCorrectionReport({
        processedCount: mappedData.length,
        skippedCount: skippedRows.length,
        skippedRows: skippedRows,
      });
      setError(null);

    } catch (err: any) {
        console.error("Error during data processing:", err);
        setError(`Data Processing Failed: ${err.message}.`);
        setEmployees([]);
    } finally {
        handleSetLoading(false);
    }
  }, [useAIForCorrection, processAndMapData, handleSetLoading]);
  
  const handleUpdateEmployee = (updatedEmployee: Employee) => {
    setEmployees(prev => prev.map(emp => emp.id === updatedEmployee.id ? updatedEmployee : emp));
  };
  
  const allSponsors = useMemo(() => [...new Set(employees.map(e => e.sponsorName).filter(Boolean))].sort(), [employees]);

  const filteredEmployees = useMemo(() => {
    if (!selectedSponsor) return employees;
    return employees.filter(e => e.sponsorName === selectedSponsor);
  }, [employees, selectedSponsor]);
  
  const handleCardClick = (filterType: string) => {
    setInitialTableFilter({ type: filterType });
    setActiveTab('directory');
  };

  const dashboardStats = useMemo(() => {
    const total = filteredEmployees.length;
    if (total === 0) return { totalEmployees: 0, saudiCount: 0, nonSaudiCount: 0, saudizationRate: '0.00%', iqamaThisMonth: 0, iqamaNextMonth: 0, contracts60_70: 0 };

    const saudiCount = filteredEmployees.filter(e => e.isSaudi).length;
    
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    const days60 = new Date(); days60.setDate(now.getDate() + 60);
    const days70 = new Date(); days70.setDate(now.getDate() + 70);

    const iqamaThisMonth = filteredEmployees.filter(e => e.visa.iqamaExpiryDate && e.visa.iqamaExpiryDate >= thisMonthStart && e.visa.iqamaExpiryDate <= thisMonthEnd).length;
    const iqamaNextMonth = filteredEmployees.filter(e => e.visa.iqamaExpiryDate && e.visa.iqamaExpiryDate >= nextMonthStart && e.visa.iqamaExpiryDate <= nextMonthEnd).length;
    const contracts60_70 = filteredEmployees.filter(e => e.contract.endDate && e.contract.endDate >= days60 && e.contract.endDate <= days70).length;

    return {
      totalEmployees: total,
      saudiCount,
      nonSaudiCount: total - saudiCount,
      saudizationRate: total > 0 ? ((saudiCount / total) * 100).toFixed(2) + '%' : '0.00%',
      iqamaThisMonth,
      iqamaNextMonth,
      contracts60_70
    };
  }, [filteredEmployees]);
  
  const nitaqatRule = useMemo(() => rules.find(r => r.type === 'NITAQAT'), [rules]);

  const renderContent = () => {
    if (employees.length === 0 && !loading && !error) {
      return (
        <div className="text-center p-10 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Welcome to the HR & Admin Module</h2>
          <p className="mt-2 text-slate-500 dark:text-slate-400">To get started, please upload your employee data file.</p>
        </div>
      );
    }
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Total Employees" value={dashboardStats.totalEmployees} color="text-primary-600 bg-primary-100 dark:bg-primary-900/50" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} />
              <StatCard title="Saudization Rate" value={dashboardStats.saudizationRate} color="text-primary-600 bg-primary-100 dark:bg-primary-900/50" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 14v6m-3-3h6M3 10h2a2 2 0 012 2v6a2 2 0 01-2 2H3v-8zm6 0h2a2 2 0 012 2v6a2 2 0 01-2 2H9v-8zm6 0h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v-8z" /></svg>} />
              <StatCard title="Saudi Nationals" value={dashboardStats.saudiCount} color="text-green-600 bg-green-100 dark:bg-green-900/50" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} onClick={() => handleCardClick('SAUDI_NATIONALS')} />
              <StatCard title="Expat Nationals" value={dashboardStats.nonSaudiCount} color="text-yellow-600 bg-yellow-100 dark:bg-yellow-900/50" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10a3 3 0 11-6 0 3 3 0 016 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>} />
              <StatCard title="Iqama Expiring This Month" value={dashboardStats.iqamaThisMonth} color="text-red-600 bg-red-100 dark:bg-red-900/50" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>} onClick={() => handleCardClick('IQAMA_EXPIRY_THIS_MONTH')} />
              <StatCard title="Iqama Expiring Next Month" value={dashboardStats.iqamaNextMonth} color="text-orange-600 bg-orange-100 dark:bg-orange-900/50" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>} onClick={() => handleCardClick('IQAMA_EXPIRY_NEXT_MONTH')} />
              <StatCard title="Contracts Expiring in 60-70 Days" value={dashboardStats.contracts60_70} colSpan={2} color="text-cyan-600 bg-cyan-100 dark:bg-cyan-900/50" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} onClick={() => handleCardClick('CONTRACT_EXPIRY_60_70_DAYS')} />
            </div>
            <ComplianceAlerts employees={filteredEmployees} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <NationalityChart data={Object.entries(filteredEmployees.reduce<Record<string, number>>((acc, e) => ({ ...acc, [e.nationality]: (acc[e.nationality] || 0) + 1 }), {})).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value)} />
              <DepartmentChart data={Object.entries(filteredEmployees.reduce<Record<string, number>>((acc, e) => ({ ...acc, [e.department]: (acc[e.department] || 0) + 1 }), {})).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value)} />
            </div>
            <div className="grid grid-cols-1 gap-6">
                <TenureChart data={Object.entries(filteredEmployees.reduce<Record<string, number>>((acc, e) => {
                    const t = e.tenure || 0;
                    if (t < 1) acc['< 1 Year']++; else if (t < 3) acc['1-3 Years']++; else if (t < 5) acc['3-5 Years']++; else if (t < 10) acc['5-10 Years']++; else acc['10+ Years']++;
                    return acc;
                }, { '< 1 Year': 0, '1-3 Years': 0, '3-5 Years': 0, '5-10 Years': 0, '10+ Years': 0 })).map(([name, value]) => ({ name, value }))} />
            </div>
          </div>
        );
      case 'directory': return <EmployeeTable employees={employees} onUpdateEmployee={handleUpdateEmployee} initialFilter={initialTableFilter} onFilterApplied={() => setInitialTableFilter(null)} />;
      case 'saudization': return nitaqatRule && <SaudizationDashboard employees={filteredEmployees} nitaqatRule={nitaqatRule} calculationFn={calculateNitaqatStatus} lang={lang} />;
      case 'payroll': return <Payroll employees={filteredEmployees} />;
      case 'loans': return <PersonalLoans employees={filteredEmployees} onUpdateEmployee={handleUpdateEmployee} />;
      case 'eosb': return <EOSBCalculator employees={filteredEmployees} />;
      case 'leave': return <LeaveManagement employees={filteredEmployees} />;
      case 'reports': return <StatutoryReports employees={filteredEmployees} />;
      case 'ask-ai': return <AskAI employees={filteredEmployees} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen text-slate-800 dark:text-slate-200 flex bg-slate-100 dark:bg-slate-900">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLanguageChange={handleLanguageChange} lang={lang} />
      <main className="flex-1 p-4 md:p-8 space-y-6 overflow-y-auto">
        <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">HR & Admin Dashboard</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Special Offices Company</p>
          </div>
          <div className="flex items-center gap-4">
            <select value={selectedSponsor} onChange={(e) => setSelectedSponsor(e.target.value)} className="p-2 border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-primary-500 transition w-full sm:w-64 text-sm">
                <option value="">All Sponsors</option>
                {allSponsors.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <label htmlFor="ai-toggle" className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" id="ai-toggle" className="sr-only peer" checked={useAIForCorrection && !DISABLE_AI_OVERRIDE && !!AI_PROXY_ENDPOINT} onChange={() => setUseAIForCorrection(!useAIForCorrection)} disabled={DISABLE_AI_OVERRIDE || !AI_PROXY_ENDPOINT} />
              <div className="w-11 h-6 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              <span className="ml-3 text-sm font-medium text-slate-600 dark:text-slate-300">Use AI Correction</span>
            </label>
          </div>
        </header>
        <FileUpload onDataLoaded={handleDataLoaded} setLoading={handleSetLoading} setError={setError} />
        {loading && <div className="text-center p-4 font-semibold text-primary-600 dark:text-primary-400">{loadingMessage || 'Loading...'}</div>}
        {error && <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg" role="alert"><strong className="font-bold">Error: </strong>{error}</div>}
        {employees.length > 0 && renderContent()}
        {correctionReport && <CorrectionReportModal report={correctionReport} onClose={() => setCorrectionReport(null)} />}
      </main>
    </div>
  );
};