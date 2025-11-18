import React, { useState, useMemo, useEffect } from 'react';
import { Employee, RuleDefinition, TerminationReason, EOSBResult } from '../types';
import { calculateEOSB, loadRules } from '../lib/rulesEngine';

export const EOSBCalculator: React.FC<{ employees: Employee[] }> = ({ employees }) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [basicSalary, setBasicSalary] = useState<number | ''>('');
  const [reason, setReason] = useState<TerminationReason>('non-renewal');
  const [terminationCompensationMonths, setTerminationCompensationMonths] = useState<number>(0);
  const [eosbRule, setEosbRule] = useState<RuleDefinition | null>(null);
  
  useEffect(() => {
      const rules = loadRules();
      const rule = rules.find(r => r.type === 'EOSB');
      if (rule) {
          setEosbRule(rule);
      } else {
          console.error("EOSB Rule not found!");
      }
  }, []);

  const selectedEmployee = useMemo(() => {
    return employees.find(e => e.employeeId === selectedEmployeeId);
  }, [selectedEmployeeId, employees]);
  
  useEffect(() => {
    setBasicSalary(selectedEmployee?.payroll.basicSalary || '');
  }, [selectedEmployee]);


  const calculationResult = useMemo(() => {
    if (!selectedEmployee || !basicSalary || basicSalary <= 0 || !eosbRule) {
      return null;
    }

    return calculateEOSB(selectedEmployee, eosbRule, reason, Number(basicSalary), terminationCompensationMonths);

  }, [selectedEmployee, basicSalary, reason, eosbRule, terminationCompensationMonths]);

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">End of Service Benefit (EOSB) Calculator</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-4">
                <div>
                    <label htmlFor="employee-select" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Select Employee</label>
                    <select
                        id="employee-select"
                        value={selectedEmployeeId}
                        onChange={(e) => setSelectedEmployeeId(e.target.value)}
                        className="block w-full p-2 border bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    >
                        <option value="">-- Choose Employee --</option>
                        {employees.map(emp => (
                            <option key={emp.employeeId} value={emp.employeeId}>{emp.employeeNameEnglish}</option>
                        ))}
                    </select>
                </div>
                 <div>
                    <label htmlFor="basic-salary" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Monthly Basic Salary (SAR)</label>
                    <input
                        type="number"
                        id="basic-salary"
                        value={basicSalary}
                        onChange={(e) => setBasicSalary(parseFloat(e.target.value) || '')}
                        className="block w-full p-2 border bg-transparent border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Enter basic salary"
                    />
                </div>
                 <div>
                    <label htmlFor="termination-reason" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Reason for Termination</label>
                    <select
                        id="termination-reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value as TerminationReason)}
                        className="block w-full p-2 border bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    >
                        <option value="non-renewal">Contract Completion / Non-Renewal</option>
                        <option value="termination">Contract Termination by Employer</option>
                        <option value="resignation">Resignation</option>
                    </select>
                </div>
                {reason === 'termination' && (
                    <div>
                        <label htmlFor="compensation-months" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Additional Compensation <span className="text-xs text-slate-400" dir="rtl">( عشان خاطر احمد فراج :) )</span>
                        </label>
                        <select
                            id="compensation-months"
                            value={terminationCompensationMonths}
                            onChange={(e) => setTerminationCompensationMonths(Number(e.target.value))}
                            className="block w-full p-2 border bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                        >
                            <option value={0}>0 Months Salary</option>
                            <option value={1}>1 Month Salary</option>
                            <option value={2}>2 Months Salary</option>
                        </select>
                    </div>
                )}
            </div>

            <div className="md:col-span-2 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-lg flex flex-col justify-center">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Calculation Result</h3>
                {calculationResult && selectedEmployee ? (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="font-medium text-slate-600 dark:text-slate-300">Employee:</span>
                            <span className="font-bold text-slate-800 dark:text-slate-100">{selectedEmployee.employeeNameEnglish}</span>
                        </div>
                         <div className="flex justify-between items-center">
                            <span className="font-medium text-slate-600 dark:text-slate-300">Years of Service:</span>
                            <span className="font-bold text-slate-800 dark:text-slate-100">{calculationResult.yearsOfService.toFixed(2)}</span>
                        </div>
                         <div className="flex justify-between items-center">
                            <span className="font-medium text-slate-600 dark:text-slate-300">EOSB Gratuity:</span>
                            <span className="font-bold text-slate-800 dark:text-slate-100">SAR {calculationResult.totalGratuity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>

                        {calculationResult.terminationCompensation && calculationResult.terminationCompensation > 0 && (
                            <div className="flex justify-between items-center">
                                <span className="font-medium text-slate-600 dark:text-slate-300">Additional Compensation:</span>
                                <span className="font-bold text-slate-800 dark:text-slate-100">SAR {calculationResult.terminationCompensation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                        )}
                        
                        {calculationResult.loanDeduction && calculationResult.loanDeduction > 0 && (
                             <div className="flex justify-between items-center text-red-600 dark:text-red-400">
                                <span className="font-medium">Outstanding Loan Deduction:</span>
                                <span className="font-bold">(- SAR {calculationResult.loanDeduction.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</span>
                            </div>
                        )}
                        
                        <hr className="my-4 border-slate-200 dark:border-slate-700"/>

                        <div className="flex justify-between items-center text-2xl">
                            <span className="font-bold text-slate-600 dark:text-slate-300">Total Settlement Amount:</span>
                            <span className="font-extrabold text-primary-600 dark:text-primary-400">
                                SAR {(
                                    calculationResult.totalGratuity + 
                                    (calculationResult.terminationCompensation || 0) -
                                    (calculationResult.loanDeduction || 0)
                                ).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/50 p-3 rounded-md">
                            <p className="font-semibold mb-1">Calculation Breakdown:</p>
                            <ul className="list-disc pl-4 space-y-1">
                                {calculationResult.calculationBreakdown.map((line, i) => <li key={i}>{line}</li>)}
                            </ul>
                        </div>
                    </div>
                ) : (
                     <div className="text-center py-10">
                        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <p className="mt-2 text-slate-500 dark:text-slate-400">Please select an employee and enter their salary to calculate the EOSB.</p>
                     </div>
                )}
            </div>
        </div>
        <div className="mt-6 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
            <strong>Disclaimer:</strong> This calculation is an estimate based on the Saudi Labor Law (Rule: {eosbRule?.id} v{eosbRule?.version}). Final settlement should always be verified by an HR professional.
        </div>
    </div>
  );
};