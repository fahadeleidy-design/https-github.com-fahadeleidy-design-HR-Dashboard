import React from 'react';
import { CorrectionReport } from '../types';

interface CorrectionReportModalProps {
  report: CorrectionReport;
  onClose: () => void;
}

export const CorrectionReportModal: React.FC<CorrectionReportModalProps> = ({ report, onClose }) => {
  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-title"
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center">
          <h2 id="report-title" className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Data Processing Report
          </h2>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            aria-label="Close correction report"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-center">
            <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg">
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Rows Processed</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{report.processedCount + report.skippedCount}</p>
            </div>
             <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
                <p className="text-sm text-green-600 dark:text-green-300">Successfully Loaded</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-200">{report.processedCount}</p>
            </div>
             <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-300">Skipped Rows</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-200">{report.skippedCount}</p>
            </div>
          </div>

          {report.skippedCount > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">Details for Skipped Rows</h3>
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 dark:bg-slate-700 text-xs text-slate-600 dark:text-slate-300 uppercase">
                    <tr>
                      <th className="px-4 py-2">Row #</th>
                      <th className="px-4 py-2">Error</th>
                      <th className="px-4 py-2">Original Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {report.skippedRows.map(({ rowNumber, error, originalData }) => (
                      <tr key={rowNumber} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="px-4 py-2 font-medium text-slate-800 dark:text-slate-200">{rowNumber}</td>
                        <td className="px-4 py-2 text-red-600 dark:text-red-400 font-semibold">{error}</td>
                        <td className="px-4 py-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
                            <code>{JSON.stringify(originalData)}</code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 text-right">
            <button onClick={onClose} className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-md hover:bg-primary-700">
                Close
            </button>
        </div>
      </div>
    </div>
  );
};