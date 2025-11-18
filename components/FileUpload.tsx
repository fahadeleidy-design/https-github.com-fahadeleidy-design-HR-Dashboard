import React, { useCallback } from 'react';
import * as XLSX from 'xlsx';

interface FileUploadProps {
  onDataLoaded: (data: any[]) => void;
  setLoading: (isLoading: boolean, message?: string) => void;
  setError: (error: string | null) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded, setLoading, setError }) => {
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setError("No file selected.");
      return;
    }

    setLoading(true, `Reading ${file.name}...`);
    setError(null);

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          throw new Error("Failed to read file data.");
        }

        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        const headerTokens = [
          'employee id', 'employee name', 'nationality', 'department', 'position', 'job title',
          'iqama', 'passport', 'date of joining', 'contract type', 'email', 'mobile', 'sponsor name',
          'gosi', 'qiwa', 'salary'
        ];

        const rowLooksLikeHeader = (row: any[]) => {
          if (!row || row.length === 0) return false;
          const lower = row.map((c: any) => String(c ?? '').toLowerCase());
          return headerTokens.some(token => lower.some((cell: string) => cell.includes(token)));
        };

        let nonEmptyRows = rawRows.filter(r => r && r.some((c: any) => String(c ?? '').trim() !== ''));

        if (!nonEmptyRows || nonEmptyRows.length === 0) {
          throw new Error('No data found in sheet or all rows are empty.');
        }

        let headerRowIdxInNonEmpty = nonEmptyRows.findIndex(rowLooksLikeHeader);

        if (headerRowIdxInNonEmpty === -1) {
          headerRowIdxInNonEmpty = 0;
          console.warn("No clear header row detected. Assuming the first non-empty row contains headers.");
        }

        const rawHeaderRow = nonEmptyRows[headerRowIdxInNonEmpty].map((h: any) => String(h ?? '').trim());

        const normalizeHeader = (h: string) => {
          const s = h.trim().toLowerCase();
          const map: Record<string, string> = {
            'employee id': 'Employee ID', 'emp id': 'Employee ID', 'id_key': 'Employee ID', 'id': 'Employee ID',
            'iqama number': 'Iqama Number', 'iqama no': 'Iqama Number', 'iqama': 'Iqama Number',
            'passport number': 'Passport Number', 'passport no': 'Passport Number', 'passport': 'Passport Number',
            'eid': 'Employee ID',
            'employee name (english)': 'Employee Name (English)', 'employee name english': 'Employee Name (English)',
            'employee name': 'Employee Name (English)',
            'qiwa_employee_name': 'Employee Name (English)',
            'gosi_name': 'Employee Name (English)',
            'name': 'Employee Name (English)',
            'employee name (arabic)': 'Employee Name (Arabic)', 'employee name arabic': 'Employee Name (Arabic)',
            'arabic name': 'Employee Name (Arabic)',
            'nationality': 'Nationality', 'qiwa_nationality': 'Nationality', 'gosi_nationality': 'Nationality',
            'department': 'Department',
            'position/job title': 'Position/Job Title', 'position': 'Position/Job Title', 'job title': 'Position/Job Title',
            'qiwa_job_title': 'Position/Job Title', 'gosi_job_title': 'Position/Job Title', 'job': 'Position/Job Title',
            'title': 'Position/Job Title',
            'status': 'Status',
            'special category': 'Special Category', 'special needs': 'Special Category', 'employment type': 'Special Category',
            'is driver': 'Is Driver',
            'date of joining': 'Date of Joining', 'doj': 'Date of Joining', 'join date': 'Date of Joining',
            'gosi_join_date': 'Date of Joining',
            'date of exit': 'Date of Exit', 'doe': 'Date of Exit', 'exit date': 'Date of Exit',
            'iqama issue date': 'Iqama Issue Date', 'iqama issue': 'Iqama Issue Date',
            'iqama expiry date': 'Iqama Expiry Date', 'iqama expiry': 'Iqama Expiry Date',
            'passport issue date': 'Passport Issue Date', 'passport issue': 'Passport Issue Date',
            'passport expiry date': 'Passport Expiry Date', 'passport expiry': 'Passport Expiry Date',
            'contract start date': 'Contract Start Date', 'contract start': 'Contract Start Date',
            'contract end date': 'Contract End Date', 'contract end': 'Contract End Date',
            'last payslip date': 'Last Payslip Date',
            'qiwa_birth_date': 'Date of Birth', 'gosi_birth_date': 'Date of Birth', 'date of birth': 'Date of Birth', 'dob': 'Date of Birth',
            'email address': 'Email', 'email': 'Email',
            'mobile number': 'Mobile Number', 'mobile': 'Mobile Number', 'phone number': 'Mobile Number',
            'sponsor name': 'Sponsor Name', 'sponsor': 'Sponsor Name',
            'contract type': 'Contract Type', 'type of contract': 'Contract Type',
            'probation days': 'Probation Days', 'probation period': 'Probation Days',
            'working hours': 'Working Hours', 'working hours per week': 'Working Hours',
            'weekly off': 'Weekly Off', 'weekend': 'Weekly Off',
            'salary currency': 'Salary Currency', 'currency': 'Salary Currency',
            'visa type': 'Visa Type', 'type of visa': 'Visa Type',
            'visa status': 'Visa Status',
            'gosi registered': 'GOSI Registered', 'registered with gosi': 'GOSI Registered',
            'gosi number': 'GOSI Number', 'gosi no': 'GOSI Number',
            'gosi contribution': 'GOSI Contribution', 'gosi contribution percent': 'GOSI Contribution',
            'gosi_basic_salary': 'Basic Salary',
            'gosi_housing': 'Housing Allowance',
            'gosi_commission': 'Commission',
            'gosi_other_allowances': 'Other Allowances',
            'gosi_total_salary': 'Total Salary',
            'gosi_taxable_salary': 'Taxable Salary',
            'gosi_insurance_eligibility': 'Insurance Eligibility',
            'basic salary': 'Basic Salary', 'base salary': 'Basic Salary',
            'housing allowance': 'Housing Allowance',
            'transportation allowance': 'Transportation Allowance',
            'other allowances': 'Other Allowances',
            'total salary': 'Total Salary',
            'total loan amount': 'Total Loan Amount', 'loan amount': 'Total Loan Amount',
            'loan start date': 'Loan Start Date', 'loan start': 'Loan Start Date',
            'iban': 'IBAN', 'bank iban': 'IBAN',
            'bank name': 'Bank Name',
            'qiwa_id': 'Qiwa ID',
            'gosi_id': 'GOSI ID',
            'qiwa_gender': 'Gender',
            'gosi_gender': 'Gender',
            'qiwa_skill_level': 'Skill Level',
            'qiwa_notes': 'Qiwa Notes',
            'notes': 'Notes',
          };
          if (map[s]) return map[s];
          if (s.includes('employee') && s.includes('name') && s.includes('eng')) return 'Employee Name (English)';
          if (s.includes('employee') && s.includes('name') && s.includes('arb')) return 'Employee Name (Arabic)';
          if (s.includes('iqama') && s.includes('issue')) return 'Iqama Issue Date';
          if (s.includes('iqama') && s.includes('expir')) return 'Iqama Expiry Date';
          if (s.includes('passport') && s.includes('issue')) return 'Passport Issue Date';
          if (s.includes('passport') && s.includes('expir')) return 'Passport Expiry Date';
          if (s.includes('date') && s.includes('join')) return 'Date of Joining';
          if (s.includes('contract') && s.includes('start')) return 'Contract Start Date';
          if (s.includes('contract') && s.includes('end')) return 'Contract End Date';
          if (s.includes('job') || s.includes('position')) return 'Position/Job Title';
          if (s.includes('gosi') && s.includes('basic')) return 'Basic Salary';
          if (s.includes('basic') && s.includes('salary')) return 'Basic Salary';
          if (s.includes('total') && s.includes('salary')) return 'Total Salary';
          if (s.includes('mobile') || s.includes('phone')) return 'Mobile Number';
          return h.split(/[\s_\-/]+/).map(word => {
            if (!word) return '';
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
          }).join(' ').trim();
        };

        const headers = rawHeaderRow.map((h: any, i: number) => {
          const candidate = String(h ?? '').trim();
          if (!candidate) return `Column${i + 1}`;
          return normalizeHeader(candidate);
        });

        const dataRows = nonEmptyRows.slice(headerRowIdxInNonEmpty + 1);

        const json = dataRows
          .map((row: any[]) => {
            if (!row || row.filter(c => String(c ?? '').trim() !== '').length === 0) return null;
            const obj: Record<string, any> = {};
            for (let i = 0; i < headers.length; i++) {
              obj[headers[i]] = row[i] ?? '';
            }
            return obj;
          })
          .filter(Boolean);

        onDataLoaded(json);

      } catch (err: any) {
        console.error("Error parsing file:", err);
        setError(`Error parsing file: ${err.message}. Please ensure it's a valid Excel file with a clear header row.`);
        onDataLoaded([]);
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = () => {
      setError("Failed to read file.");
      setLoading(false);
    };

    reader.readAsArrayBuffer(file);
  }, [onDataLoaded, setLoading, setError]);
  
  const createCsvTemplate = () => {
    const headers = ["Employee ID", "Employee Name (English)", "Employee Name (Arabic)", "Nationality", "Special Category", "Is Driver", "Department", "Position/Job Title", "Status", "Date of Joining", "IQAMA Number", "IQAMA Issue Date", "IQAMA Expiry Date", "Passport Number", "Passport Issue Date", "Passport Expiry Date", "Contract Type", "Contract Start Date", "Contract End Date", "Email Address", "Mobile Number", "Sponsor Name", "GOSI Number", "Basic Salary", "Housing Allowance", "Transportation Allowance", "Total Loan Amount", "Loan Start Date", "IBAN", "Bank Name"];
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers.join(',');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "employee_data_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 p-4 mb-4 rounded-r-lg">
            <div className="flex">
                <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                </div>
                <div className="ml-3">
                    <p className="text-sm text-yellow-700 dark:text-yellow-200">
                        <span className="font-bold">Important:</span> Uploading a file will <span className="font-bold">overwrite all existing data</span>, including any manual changes you have made in the app.
                    </p>
                </div>
            </div>
        </div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Upload / Overwrite Data</h2>
        </div>
        <div className="flex items-center gap-3">
            <button
              onClick={createCsvTemplate}
              className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              Download Template
            </button>
            <input
              type="file"
              accept=".xlsx, .csv"
              onChange={handleFileUpload}
              className="block w-full text-sm text-slate-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-primary-50 file:text-primary-700
                dark:file:bg-primary-900/50 dark:file:text-primary-300
                hover:file:bg-primary-100 dark:hover:file:bg-primary-800/50"
            />
        </div>
      </div>
    </div>
  );
};