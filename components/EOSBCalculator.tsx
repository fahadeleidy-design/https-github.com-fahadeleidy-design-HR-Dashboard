
import React, { useState, useMemo, useEffect } from 'react';
import { Employee } from '../types';

interface EOSBCalculatorProps {
  employees: Employee[];
}

const calculateYearsOfService = (joiningDate: Date | null): number => {
    if (!joiningDate) return 0;
    const today = new Date();
    const join = new Date(joiningDate);
    const diffTime = Math.abs(today.getTime() - join.getTime());
    return diffTime / (1000 * 60 * 60 * 24 * 365.25); // Account for leap years
};

export const EOSBCalculator: React.FC<EOSBCalculatorProps> = ({ employees }) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [basicSalary, setBasicSalary] = useState<number>(0);
  const [reason, setReason] = useState<'resignation' | 'non-renewal'>('non-renewal');

  const selectedEmployee = useMemo(() => {
    return employees.find(e => e.employeeId === selectedEmployeeId);
  }, [selectedEmployeeId, employees]);
  
  // Correctly handle the side effect of updating salary when employee changes
  useEffect(() => {
    if (selectedEmployee) {
      setBasicSalary(selectedEmployee.basicSalary || 0);
    } else {
      // Reset salary if no employee is selected
      setBasicSalary(0);
    }
  }, [selectedEmployee]);


  const calculationResult = useMemo(() => {
    if (!selectedEmployee || !selectedEmployee.dateOfJoining || basicSalary <= 0) {
      return null;
    }

    const yearsOfService = calculateYearsOfService(selectedEmployee.dateOfJoining);
    let gratuity = 0;

    // Standard calculation: 0.5 month's pay for first 5 years, 1 month's pay thereafter
    if (yearsOfService <= 5) {
      gratuity = yearsOfService * (basicSalary / 2);
    } else {
      gratuity = (5 * (basicSalary / 2)) + ((yearsOfService - 5) * basicSalary);
    }

    // Adjust for resignation based on Saudi Labor Law
    if (reason === 'resignation') {
      if (yearsOfService >= 2 && yearsOfService < 5) {
        gratuity *= (1 / 3);
      } else if (yearsOfService >= 5 && yearsOfService < 10) {
        gratuity *= (2 / 3);
      }
      // If years > 10, employee gets the full amount, so no change.
      // If years < 2, employee gets nothing.
       if (yearsOfService < 2) {
        gratuity = 0;
      }
    }

    return {
      yearsOfService: yearsOfService.toFixed(2),
      totalGratuity: gratuity.toFixed(2),
    };
  }, [selectedEmployee, basicSalary, reason]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 mb-4">End of Service Benefit (EOSB) Calculator</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* --- Input Form --- */}
            <div className="md:col-span-1 space-y-4">
                <div>
                    <label htmlFor="employee-select" className="block text-sm font-medium text-slate-700 mb-1">Select Employee</label>
                    <select
                        id="employee-select"
                        value={selectedEmployeeId}
                        onChange={(e) => setSelectedEmployeeId(e.target.value)}
                        className="block w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">-- Choose Employee --</option>
                        {employees.map(emp => (
                            <option key={emp.employeeId} value={emp.employeeId}>{emp.employeeNameEnglish}</option>
                        ))}
                    </select>
                </div>
                 <div>
                    <label htmlFor="basic-salary" className="block text-sm font-medium text-slate-700 mb-1">Monthly Basic Salary (SAR)</label>
                    <input
                        type="number"
                        id="basic-salary"
                        value={basicSalary}
                        onChange={(e) => setBasicSalary(parseFloat(e.target.value) || 0)}
                        className="block w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter basic salary"
                    />
                </div>
                 <div>
                    <label htmlFor="termination-reason" className="block text-sm font-medium text-slate-700 mb-1">Reason for Termination</label>
                    <select
                        id="termination-reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value as any)}
                        className="block w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="non-renewal">Contract Completion / Non-Renewal</option>
                        <option value="resignation">Resignation</option>
                    </select>
                </div>
            </div>

             {/* --- Calculation Result --- */}
            <div className="md:col-span-2 bg-slate-50 p-6 rounded-lg">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Calculation Result</h3>
                {calculationResult && selectedEmployee ? (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="font-medium text-slate-600">Employee:</span>
                            <span className="font-bold text-slate-800">{selectedEmployee.employeeNameEnglish}</span>
                        </div>
                         <div className="flex justify-between items-center">
                            <span className="font-medium text-slate-600">Years of Service:</span>
                            <span className="font-bold text-slate-800">{calculationResult.yearsOfService}</span>
                        </div>
                        <hr className="my-4"/>
                        <div className="flex justify-between items-center text-2xl">
                            <span className="font-bold text-slate-600">Total EOSB Gratuity:</span>
                            <span className="font-extrabold text-blue-600">SAR {calculationResult.totalGratuity}</span>
                        </div>
                    </div>
                ) : (
                     <div className="text-center py-10">
                        <svg xmlns="http://www.w.org/2000/svg" className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <p className="mt-2 text-slate-500">Please select an employee and enter their salary to calculate the EOSB.</p>
                     </div>
                )}
            </div>
        </div>
        <div className="mt-6 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
            <strong>Disclaimer:</strong> This calculation is an estimate based on the Saudi Labor Law. Final settlement should always be verified by an HR professional or legal counsel. The calculation for resignation is adjusted as follows: 1/3 of the award for 2-5 years of service, 2/3 for 5-10 years, and the full award for 10+ years. No gratuity is due for resignation with less than 2 years of service.
        </div>
    </div>
  );
};
