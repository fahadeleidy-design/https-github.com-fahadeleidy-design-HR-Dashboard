import React, { useState, useEffect } from 'react';
import { Employee, LoanInfo } from '../types';

interface PersonalLoansProps {
  employees: Employee[];
  onUpdateEmployee: (employee: Employee) => void;
}

const formatDateForInput = (date: Date | null): string => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
};

const getLoanStatus = (loan: LoanInfo | undefined, currentDate: Date): { status: 'Pending' | 'Active' | 'Completed' | 'N/A', color: string } => {
    if (!loan || !loan.totalAmount || !loan.startDate) {
        return { status: 'N/A', color: 'text-slate-500' };
    }
    const startDate = new Date(loan.startDate);
    const endDate = new Date(startDate);
    endDate.setMonth(startDate.getMonth() + (loan.installments || 4));

    if (currentDate < startDate) {
        return { status: 'Pending', color: 'text-yellow-500' };
    } else if (currentDate >= startDate && currentDate < endDate) {
        return { status: 'Active', color: 'text-green-500' };
    } else {
        return { status: 'Completed', color: 'text-blue-500' };
    }
};

export const PersonalLoans: React.FC<PersonalLoansProps> = ({ employees, onUpdateEmployee }) => {
  const [loanInfos, setLoanInfos] = useState<Record<string, LoanInfo>>({});
  const currentDate = new Date();

  useEffect(() => {
    const initialLoans: Record<string, LoanInfo> = {};
    employees.forEach(emp => {
      initialLoans[emp.employeeId] = emp.payroll.loanInfo || {};
    });
    setLoanInfos(initialLoans);
  }, [employees]);

  const handleLoanChange = (employeeId: string, field: keyof LoanInfo, value: any) => {
    let parsedValue = value;
    if (field === 'startDate') {
        parsedValue = value ? new Date(value) : null;
    } else if (field === 'totalAmount') {
        parsedValue = value ? parseFloat(value) : undefined;
    }

    setLoanInfos(prev => ({
      ...prev,
      [employeeId]: {
          ...prev[employeeId],
          [field]: parsedValue
      }
    }));
  };

  const handleSave = (employeeId: string) => {
    const employee = employees.find(emp => emp.employeeId === employeeId);
    if (employee) {
      const updatedEmployee: Employee = {
        ...employee,
        payroll: {
          ...employee.payroll,
          loanInfo: loanInfos[employeeId],
        },
      };
      onUpdateEmployee(updatedEmployee);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Manage Personal Loans</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
          <thead className="text-xs text-slate-700 dark:text-slate-300 uppercase bg-slate-100 dark:bg-slate-700">
            <tr>
              <th scope="col" className="px-6 py-3">Employee</th>
              <th scope="col" className="px-6 py-3">Total Loan (SAR)</th>
              <th scope="col" className="px-6 py-3">Start Date</th>
              <th scope="col" className="px-6 py-3">Monthly Installment</th>
              <th scope="col" className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => {
              const loan = loanInfos[emp.employeeId] || {};
              const monthlyInstallment = loan.totalAmount ? loan.totalAmount / (loan.installments || 4) : 0;
              const { status, color } = getLoanStatus(loan, currentDate);

              return (
              <tr key={emp.employeeId} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800 dark:text-slate-100">{emp.employeeNameEnglish}</div>
                    <div className="text-xs text-slate-500">{emp.employeeId}</div>
                </td>
                <td className="px-6 py-4">
                  <input
                    type="number"
                    value={loan.totalAmount || ''}
                    onChange={(e) => handleLoanChange(emp.employeeId, 'totalAmount', e.target.value)}
                    onBlur={() => handleSave(emp.employeeId)}
                    className="w-40 p-2 text-right font-semibold bg-transparent border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-primary-500 text-primary-600 dark:text-primary-400"
                    placeholder="0.00"
                  />
                </td>
                 <td className="px-6 py-4">
                  <input
                    type="month"
                    value={formatDateForInput(loan.startDate || null)}
                    onChange={(e) => handleLoanChange(emp.employeeId, 'startDate', e.target.value)}
                    onBlur={() => handleSave(emp.employeeId)}
                    className="w-40 p-2 bg-transparent border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-primary-500"
                  />
                </td>
                <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-200">
                    SAR {monthlyInstallment.toFixed(2)}
                </td>
                <td className={`px-6 py-4 font-bold ${color}`}>
                    {status}
                </td>
              </tr>
            )})}
            {employees.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-10 text-slate-500 dark:text-slate-400">
                  No employee data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-4 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
        <strong>Note:</strong> Enter the total loan amount and the month/year for the first deduction. The monthly installment is automatically calculated based on a 4-month repayment policy. Changes are saved automatically.
      </div>
    </div>
  );
};