import React, { useState, useMemo, useEffect } from 'react';
import { Employee, PayrollRun, PayrollRecord, RuleDefinition } from '../types';
import { loadRules, calculateGOSI } from '../lib/rulesEngine';
import { PayslipModal } from './PayslipModal';

const nf = new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const Payroll: React.FC<{ employees: Employee[] }> = ({ employees }) => {
  const [payrollRun, setPayrollRun] = useState<PayrollRun | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [overtimeHours, setOvertimeHours] = useState<Record<string, number>>({});
  const [gosiRule, setGosiRule] = useState<RuleDefinition | null>(null);
  const [overtimeRule, setOvertimeRule] = useState<RuleDefinition | null>(null);
  const [selectedEmployeeForPayslip, setSelectedEmployeeForPayslip] = useState<[Employee, PayrollRecord] | null>(null);
  const [showArabicNames, setShowArabicNames] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const rules = loadRules();
    setGosiRule(rules.find(r => r.type === 'GOSI') || null);
    setOvertimeRule(rules.find(r => r.type === 'OVERTIME') || null);
  }, []);

  const handleRunPayroll = () => {
    if (!gosiRule || !overtimeRule) {
        alert("Payroll rules are not loaded. Cannot run payroll.");
        return;
    }
    
    const payrollDate = new Date(selectedYear, selectedMonth, 1);

    const records: PayrollRecord[] = employees.map(emp => {
      const basicSalary = emp.payroll.basicSalary || 0;
      const housingAllowance = emp.payroll.housingAllowance || 0;
      const transportationAllowance = emp.payroll.transportationAllowance || 0;
      const otherAllowances = (emp.payroll.commission || 0) + (emp.payroll.otherAllowances || 0);
      
      const hours = overtimeHours[emp.employeeId] || 0;
      const hourlyRate = (basicSalary / overtimeRule.parameters.workingDaysPerMonth) / overtimeRule.parameters.workingHoursPerDay;
      const overtimePay = hours * hourlyRate * overtimeRule.parameters.multiplier;

      let personalLoanDeduction = 0;
      let loanPayoutAmount = 0;
      const loanInfo = emp.payroll.loanInfo;
      
      if (loanInfo && loanInfo.totalAmount && loanInfo.startDate) {
          const loanStartDate = new Date(loanInfo.startDate);
          
          // Check for loan payout (month before deduction starts)
          const payoutDate = new Date(loanStartDate);
          payoutDate.setMonth(payoutDate.getMonth() - 1);
          if (payoutDate.getFullYear() === selectedYear && payoutDate.getMonth() === selectedMonth) {
              loanPayoutAmount = loanInfo.totalAmount;
          }

          // Check for loan deduction
          const loanEndDate = new Date(loanStartDate);
          loanEndDate.setMonth(loanStartDate.getMonth() + (loanInfo.installments || 4));
          if (payrollDate >= loanStartDate && payrollDate < loanEndDate) {
              personalLoanDeduction = loanInfo.totalAmount / (loanInfo.installments || 4);
          }
      }

      const grossEarnings = basicSalary + housingAllowance + transportationAllowance + otherAllowances + overtimePay + loanPayoutAmount;
      
      const gosiContributions = calculateGOSI(emp, gosiRule);
      
      const totalDeductions = gosiContributions.employee + personalLoanDeduction;
      const netPay = grossEarnings - totalDeductions;

      return {
        employeeId: emp.employeeId,
        employeeName: showArabicNames ? emp.employeeNameArabic : emp.employeeNameEnglish,
        basicSalary,
        housingAllowance,
        transportationAllowance,
        otherAllowances,
        overtimeHours: hours,
        overtimePay,
        loanPayoutAmount,
        grossEarnings,
        gosiDeductionEmployee: gosiContributions.employee,
        gosiDeductionEmployer: gosiContributions.employer,
        personalLoanDeduction,
        totalDeductions,
        netPay,
      };
    });

    setPayrollRun({
      month: selectedMonth,
      year: selectedYear,
      records: records,
      runDate: new Date(),
    });
  };

  const filteredRecords = useMemo(() => {
    if (!payrollRun) return [];
    if (!searchTerm) return payrollRun.records;
    
    const lowercasedFilter = searchTerm.toLowerCase();
    return payrollRun.records.filter(rec =>
      rec.employeeName.toLowerCase().includes(lowercasedFilter) ||
      rec.employeeId.toLowerCase().includes(lowercasedFilter)
    );
  }, [payrollRun, searchTerm]);


  const totals = useMemo(() => {
    if (!payrollRun) return null;
    return filteredRecords.reduce((acc, rec) => ({
      gross: acc.gross + rec.grossEarnings,
      gosi: acc.gosi + rec.gosiDeductionEmployee,
      loan: acc.loan + rec.personalLoanDeduction,
      deductions: acc.deductions + rec.totalDeductions,
      net: acc.net + rec.netPay,
    }), { gross: 0, gosi: 0, loan: 0, deductions: 0, net: 0 });
  }, [filteredRecords, payrollRun]);

  const exportToCsv = () => {
    if (!payrollRun) return;
    const filename = `payroll_summary_${selectedYear}_${String(selectedMonth+1).padStart(2,'0')}.csv`;
    const headers = Object.keys(payrollRun.records[0]).join(',');
    const csvRows = [
      headers,
      ...payrollRun.records.map(row => Object.values(row).join(','))
    ];
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  return (
    <>
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Payroll Management</h2>
        {payrollRun && (
          <button onClick={exportToCsv} className="flex items-center justify-center gap-2 bg-slate-600 dark:bg-slate-700 text-white font-bold py-2 px-4 rounded-md hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export Summary
          </button>
        )}
      </div>

      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg flex flex-col md:flex-row items-center gap-4">
        <div className="flex-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Payroll Period</label>
            <div className="flex gap-2 mt-1">
                <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className="p-2 border bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded-md w-full">
                    {Array.from({length: 12}, (_, i) => <option key={i} value={i}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>)}
                </select>
                <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="p-2 border bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded-md w-full">
                    {Array.from({length: 5}, (_, i) => <option key={i} value={new Date().getFullYear() - i}>{new Date().getFullYear() - i}</option>)}
                </select>
            </div>
        </div>
        <div className="flex items-center gap-2 self-end">
          <label htmlFor="name-lang-toggle" className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" id="name-lang-toggle" className="sr-only peer" checked={showArabicNames} onChange={() => setShowArabicNames(!showArabicNames)} />
              <div className="w-11 h-6 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              <span className="ml-3 text-sm font-medium text-slate-600 dark:text-slate-300">Show Arabic Names</span>
            </label>
        </div>
        <button onClick={handleRunPayroll} className="w-full md:w-auto px-6 py-3 bg-primary-600 text-white font-bold rounded-md hover:bg-primary-700 transition-colors self-end">
            Run Payroll
        </button>
      </div>

      {payrollRun ? (
        <>
        <div className="relative mb-4">
            <input
                type="text"
                placeholder="Search by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 pl-10 border bg-transparent border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-primary-500 transition"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
            <thead className="text-xs text-slate-700 dark:text-slate-300 uppercase bg-slate-100 dark:bg-slate-700">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3 text-right">Gross Earnings</th>
                <th className="px-4 py-3 text-center">OT (Hrs)</th>
                <th className="px-4 py-3 text-right">GOSI</th>
                <th className="px-4 py-3 text-right">Loan</th>
                <th className="px-4 py-3 text-right">Total Deductions</th>
                <th className="px-4 py-3 text-right font-bold">Net Pay</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map(rec => {
                const emp = employees.find(e => e.employeeId === rec.employeeId);
                const isRtl = showArabicNames && /[\u0600-\u06FF]/.test(rec.employeeName);
                return (
                <tr key={rec.employeeId} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className={`px-4 py-2 font-semibold text-slate-800 dark:text-slate-100 ${isRtl ? 'text-right' : ''}`} dir={isRtl ? 'rtl' : 'ltr'}>{rec.employeeName}</td>
                  <td className="px-4 py-2 text-right">{nf.format(rec.grossEarnings)}</td>
                  <td className="px-4 py-2 text-center w-24">
                    <input type="number" 
                        value={overtimeHours[rec.employeeId] || ''}
                        onChange={e => setOvertimeHours({...overtimeHours, [rec.employeeId]: Number(e.target.value)})}
                        onBlur={handleRunPayroll}
                        className="w-16 p-1 text-center bg-transparent border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-primary-500"
                    />
                  </td>
                  <td className="px-4 py-2 text-right text-red-600 dark:text-red-400">({nf.format(rec.gosiDeductionEmployee)})</td>
                  <td className="px-4 py-2 text-right text-red-600 dark:text-red-400">({nf.format(rec.personalLoanDeduction)})</td>
                  <td className="px-4 py-2 text-right font-semibold text-red-700 dark:text-red-300">({nf.format(rec.totalDeductions)})</td>
                  <td className="px-4 py-2 text-right font-extrabold text-primary-600 dark:text-primary-400">{nf.format(rec.netPay)}</td>
                  <td className="px-4 py-2 text-center">
                    <button onClick={() => emp && setSelectedEmployeeForPayslip([emp, rec])} className="text-xs text-primary-600 hover:underline">View Payslip</button>
                  </td>
                </tr>
              )})}
            </tbody>
            {totals && (
                <tfoot className="font-bold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-700">
                    <tr>
                        <td className="px-4 py-3">Totals</td>
                        <td className="px-4 py-3 text-right">{nf.format(totals.gross)}</td>
                        <td></td>
                        <td className="px-4 py-3 text-right text-red-600 dark:text-red-400">({nf.format(totals.gosi)})</td>
                        <td className="px-4 py-3 text-right text-red-600 dark:text-red-400">({nf.format(totals.loan)})</td>
                        <td className="px-4 py-3 text-right font-bold text-red-700 dark:text-red-300">({nf.format(totals.deductions)})</td>
                        <td className="px-4 py-3 text-right text-primary-600 dark:text-primary-400">{nf.format(totals.net)}</td>
                        <td></td>
                    </tr>
                </tfoot>
            )}
          </table>
        </div>
        </>
      ) : (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            <p>Select a payroll period and click "Run Payroll" to generate the summary.</p>
        </div>
      )}
    </div>
    {selectedEmployeeForPayslip && (
        <PayslipModal
            employee={selectedEmployeeForPayslip[0]}
            record={selectedEmployeeForPayslip[1]}
            run={payrollRun!}
            onClose={() => setSelectedEmployeeForPayslip(null)}
        />
    )}
    </>
  );
};