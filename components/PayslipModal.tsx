import React from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Employee, PayrollRecord, PayrollRun } from '../types';

interface PayslipModalProps {
  employee: Employee;
  record: PayrollRecord;
  run: PayrollRun;
  onClose: () => void;
}

const nf = new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 });

const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div>
    <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{value || 'N/A'}</p>
  </div>
);

export const PayslipModal: React.FC<PayslipModalProps> = ({ employee, record, run, onClose }) => {
  
  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    const payrollMonth = new Date(run.year, run.month).toLocaleString('default', { month: 'long', year: 'numeric' });

    // Header
    doc.setFontSize(20);
    doc.text("Payslip", 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`For the month of ${payrollMonth}`, 105, 28, { align: 'center' });

    // Employee Details
    autoTable(doc, {
      startY: 40,
      body: [
        ['Employee ID', employee.employeeId, 'Pay Date', run.runDate.toLocaleDateString('en-CA')],
        ['Employee Name', employee.employeeNameEnglish, 'Bank', employee.bankName || 'N/A'],
        ['Job Title', employee.jobTitle, 'IBAN', employee.iban || 'N/A'],
        ['Department', employee.department, 'Sponsor', employee.sponsorName],
      ],
      theme: 'plain',
      styles: { fontSize: 10 },
      columnStyles: {
        0: { fontStyle: 'bold' },
        2: { fontStyle: 'bold' },
      },
    });

    // Earnings and Deductions
    const earningsRows = [
        ['Basic Salary', nf.format(record.basicSalary)],
        ['Housing Allowance', nf.format(record.housingAllowance)],
        ['Transportation Allowance', nf.format(record.transportationAllowance)],
        ['Other Allowances', nf.format(record.otherAllowances)],
        ['Overtime Pay', nf.format(record.overtimePay)],
    ];
    if (record.loanPayoutAmount > 0) {
        earningsRows.push(['Loan Payout', nf.format(record.loanPayoutAmount)]);
    }

    const deductionsRows = [
        ['GOSI Contribution', nf.format(record.gosiDeductionEmployee)],
        ['Personal Loan', nf.format(record.personalLoanDeduction)],
    ].filter(row => parseFloat(String(row[1]).replace(/,/g, '')) > 0);
    
    const maxLength = Math.max(earningsRows.length, deductionsRows.length);
    const pdfBody = [];
    for (let i = 0; i < maxLength; i++) {
        const earning = earningsRows[i] || ['', ''];
        const deduction = deductionsRows[i] || ['', ''];
        pdfBody.push([...earning, ...deduction]);
    }


    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Earnings', 'Amount (SAR)', 'Deductions', 'Amount (SAR)']],
      body: pdfBody,
      foot: [
        [{ content: 'Gross Earnings', styles: { fontStyle: 'bold' } }, nf.format(record.grossEarnings), { content: 'Total Deductions', styles: { fontStyle: 'bold' } }, nf.format(record.totalDeductions)]
      ],
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] },
      footStyles: { fillColor: [236, 240, 241], textColor: [44, 62, 80] },
      columnStyles: { 1: { halign: 'right' }, 3: { halign: 'right' } },
    });
    
    // Net Pay Summary
    autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 5,
        body: [[{ content: 'Net Pay', styles: {fontStyle: 'bold', fontSize: 14} }, {content: `SAR ${nf.format(record.netPay)}`, styles: {fontStyle: 'bold', fontSize: 14, halign: 'right'}}]],
        theme: 'plain'
    });

    doc.save(`Payslip_${employee.employeeNameEnglish.replace(/ /g, '_')}_${run.year}_${run.month+1}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <header className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Payslip for {new Date(run.year, run.month).toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>
        <main className="p-6 overflow-y-auto">
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <DetailItem label="Employee ID" value={employee.employeeId} />
                <DetailItem label="Employee Name" value={employee.employeeNameEnglish} />
                <DetailItem label="Bank" value={employee.bankName} />
                <DetailItem label="IBAN" value={employee.iban} />
            </div>
            <div className="grid grid-cols-2 gap-6">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <h3 className="font-bold text-green-800 dark:text-green-300 mb-2">Earnings</h3>
                    <div className="space-y-1 text-sm">
                        <div className="flex justify-between"><span>Basic Salary:</span> <span>{nf.format(record.basicSalary)}</span></div>
                        <div className="flex justify-between"><span>Housing Allowance:</span> <span>{nf.format(record.housingAllowance)}</span></div>
                        <div className="flex justify-between"><span>Transportation Allowance:</span> <span>{nf.format(record.transportationAllowance)}</span></div>
                        <div className="flex justify-between"><span>Other Allowances:</span> <span>{nf.format(record.otherAllowances)}</span></div>
                        <div className="flex justify-between"><span>Overtime Pay ({record.overtimeHours} hrs):</span> <span>{nf.format(record.overtimePay)}</span></div>
                        {record.loanPayoutAmount > 0 && (
                            <div className="flex justify-between font-semibold text-green-700 dark:text-green-200"><span>Loan Payout:</span> <span>{nf.format(record.loanPayoutAmount)}</span></div>
                        )}
                        <hr className="my-1 border-green-200 dark:border-green-700"/>
                        <div className="flex justify-between font-bold"><span>Gross Earnings:</span> <span>{nf.format(record.grossEarnings)}</span></div>
                    </div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                    <h3 className="font-bold text-red-800 dark:text-red-300 mb-2">Deductions</h3>
                     <div className="space-y-1 text-sm">
                        <div className="flex justify-between"><span>GOSI Contribution:</span> <span>{nf.format(record.gosiDeductionEmployee)}</span></div>
                        {record.personalLoanDeduction > 0 && (
                             <div className="flex justify-between"><span>Personal Loan:</span> <span>{nf.format(record.personalLoanDeduction)}</span></div>
                        )}
                        <hr className="my-1 border-red-200 dark:border-red-700"/>
                        <div className="flex justify-between font-bold"><span>Total Deductions:</span> <span>{nf.format(record.totalDeductions)}</span></div>
                    </div>
                </div>
            </div>
             <div className="mt-6 bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg flex justify-between items-center">
                <h3 className="text-lg font-extrabold text-blue-800 dark:text-blue-200">Net Pay</h3>
                <p className="text-2xl font-extrabold text-blue-800 dark:text-blue-200">SAR {nf.format(record.netPay)}</p>
            </div>
        </main>
        <footer className="px-6 py-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
             <button onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-100 font-semibold rounded-md hover:bg-slate-300 dark:hover:bg-slate-500">Close</button>
             <button onClick={handleDownloadPdf} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Download PDF
            </button>
        </footer>
      </div>
    </div>
  );
};