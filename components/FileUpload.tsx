
import React, { useCallback, useRef } from 'react';

interface FileUploadProps {
  onDataLoaded: (data: any[]) => void;
  setLoading: (loading: boolean, message?: string) => void;
  setError: (error: string | null) => void;
}

const requiredColumns = [
    'Employee ID', 'Employee Name (Arabic)', 'Employee Name (English)', 'Nationality', 
    'Department', 'Position/Job Title', 'Status', 'Date of Joining', 'IQAMA Number', 
    'IQAMA Issue Date', 'IQAMA Expiry Date', 'Passport Number', 'Passport Issue Date', 
    'Passport Expiry Date', 'Contract Type', 'Contract Start Date', 'Contract End Date', 
    'Email Address', 'Mobile Number', 'Sponsor Name'
];


export const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded, setLoading, setError }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true, 'Reading file...');
    setError(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = (window as any).XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = (window as any).XLSX.utils.sheet_to_json(worksheet, { raw: false });
        
        if (json.length === 0) {
            throw new Error("The Excel file is empty or the first sheet has no data.");
        }

        // Validate columns
        const headers = Object.keys(json[0]);
        const missingColumns = requiredColumns.filter(col => !headers.includes(col));

        if (missingColumns.length > 0) {
            throw new Error(`Missing required columns: ${missingColumns.join(', ')}.`);
        }
        onDataLoaded(json);
        
      } catch (err: any) {
        setError(err.message || 'An error occurred while parsing the file.');
        onDataLoaded([]);
      } finally {
        setLoading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.onerror = () => {
        setError('Failed to read the file.');
        setLoading(false);
    };
    reader.readAsArrayBuffer(file);
  }, [onDataLoaded, setLoading, setError]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <div className="flex-grow">
          <h2 className="text-xl font-bold text-slate-800">Upload Employee Data</h2>
          <p className="text-sm text-slate-500 mt-1">
            Upload an Excel (.xlsx) file with the required column format.
          </p>
           <div className="mt-4 flex items-center gap-4">
              <label htmlFor="file-upload" className="cursor-pointer bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors">
                Select Excel File
              </label>
              <input 
                id="file-upload" 
                ref={fileInputRef}
                type="file" 
                className="hidden"
                accept=".xlsx, .xls"
                onChange={handleFileChange} 
              />
          </div>
        </div>
         <div className="w-full md:w-auto mt-4 md:mt-0 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-4">
            <h3 className="text-sm font-semibold text-slate-600">Required Columns:</h3>
            <ul className="text-xs text-slate-500 mt-2 grid grid-cols-3 gap-x-4 gap-y-1">
                {requiredColumns.map(col => <li key={col}>• {col}</li>)}
            </ul>
        </div>
      </div>
    </div>
  );
};