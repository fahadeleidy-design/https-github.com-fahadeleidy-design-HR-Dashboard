import React, { useState, useMemo } from 'react';
import { Employee, RuleDefinition, NitaqatInfo } from '../types';

interface SaudizationSimulatorProps {
  employees: Employee[];
  nitaqatRule: RuleDefinition;
  // FIX: Update the calculationFn signature to accept an array of full or partial employees.
  calculationFn: (employees: (Employee | Partial<Employee>)[], rule: RuleDefinition, sector: string, lang: 'en' | 'ar') => NitaqatInfo;
  sector: string;
  lang: 'en' | 'ar';
}

const nf = new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 });

const getTotalSalary = (employee: Employee): number => {
    const p = employee.payroll;
    return (p.basicSalary || 0) + (p.housingAllowance || 0) + (p.transportationAllowance || 0) + (p.commission || 0) + (p.otherAllowances || 0);
};


export const SaudizationSimulator: React.FC<SaudizationSimulatorProps> = ({ employees, nitaqatRule, calculationFn, sector, lang }) => {
  const [newSaudiHires, setNewSaudiHires] = useState<number | ''>(0);
  const [newNonSaudiHires, setNewNonSaudiHires] = useState<number | ''>(0);
  const [terminatedEmployees, setTerminatedEmployees] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const currentMetrics = useMemo(() => {
    const totalSalary = employees.reduce((sum, emp) => sum + getTotalSalary(emp), 0);
    return {
      saudi: employees.filter(e => e.isSaudi).length,
      nonSaudi: employees.filter(e => !e.isSaudi).length,
      total: employees.length,
      totalSalary: totalSalary,
    }
  }, [employees]);
  
  const currentNitaqat = useMemo(() => calculationFn(employees, nitaqatRule, sector, lang), [employees, nitaqatRule, sector, lang, calculationFn]);

  // FIX: Combine simulator calculations into a single memoized block for efficiency and correctness.
  const { simulatedNitaqat, simulatedMetrics } = useMemo(() => {
    const simulatedEmployees = [
      ...employees.filter(e => !terminatedEmployees.includes(e.employeeId)),
      ...Array(Number(newSaudiHires) || 0).fill(0).map((_, i) => ({ isSaudi: true, specialCategory: 'normal' } as Partial<Employee>)),
      ...Array(Number(newNonSaudiHires) || 0).fill(0).map((_, i) => ({ isSaudi: false, specialCategory: 'normal' } as Partial<Employee>)),
    ];
    
    const nitaqatResult = calculationFn(simulatedEmployees, nitaqatRule, sector, lang);

    const terminatedSalaries = employees
        .filter(e => terminatedEmployees.includes(e.employeeId))
        .reduce((sum, emp) => sum + getTotalSalary(emp), 0);
    const simulatedSalary = currentMetrics.totalSalary - terminatedSalaries;
    
    const totalSimulated = simulatedEmployees.length;
    const saudiSimulated = nitaqatResult.rawSaudiCount ?? simulatedEmployees.filter(e => e.isSaudi).length;

    const metrics = {
      saudi: saudiSimulated,
      nonSaudi: totalSimulated - saudiSimulated,
      total: totalSimulated,
      totalSalary: Math.max(0, simulatedSalary),
    };

    return { simulatedNitaqat: nitaqatResult, simulatedMetrics: metrics };
  }, [employees, newSaudiHires, newNonSaudiHires, terminatedEmployees, nitaqatRule, sector, lang, calculationFn, currentMetrics.totalSalary]);


  const filteredEmployees = useMemo(() => {
    if (!searchTerm) return employees;
    const lowercasedFilter = searchTerm.toLowerCase();
    return employees.filter(emp =>
      emp.employeeNameEnglish.toLowerCase().includes(lowercasedFilter) ||
      emp.employeeId.toLowerCase().includes(lowercasedFilter)
    );
  }, [employees, searchTerm]);

  const toggleTermination = (employeeId: string) => {
    setTerminatedEmployees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };
  
  const resetSimulation = () => {
    setNewSaudiHires(0);
    setNewNonSaudiHires(0);
    setTerminatedEmployees([]);
    setSearchTerm('');
  };


  const ResultRow: React.FC<{ label: string; current: string | number; simulated: string | number; highlight?: boolean }> = ({ label, current, simulated, highlight }) => (
    <tr className="border-b border-slate-200 dark:border-slate-700 last:border-b-0">
        <td className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">{label}</td>
        <td className="py-3 px-4 text-center">{current}</td>
        <td className={`py-3 px-4 text-center font-bold ${highlight ? 'text-primary-600 dark:text-primary-400' : ''}`}>{simulated}</td>
    </tr>
  );

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Saudization Simulator</h2>
            <button
                onClick={resetSimulation}
                className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
                Reset Simulation
            </button>
        </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">New Hires</label>
            <div className="flex gap-2">
              <input type="number" placeholder="Saudi" value={newSaudiHires} onChange={e => setNewSaudiHires(e.target.value === '' ? '' : parseInt(e.target.value))} className="w-full p-2 border bg-transparent border-slate-300 dark:border-slate-600 rounded-md focus:ring-primary-500" />
              <input type="number" placeholder="Non-Saudi" value={newNonSaudiHires} onChange={e => setNewNonSaudiHires(e.target.value === '' ? '' : parseInt(e.target.value))} className="w-full p-2 border bg-transparent border-slate-300 dark:border-slate-600 rounded-md focus:ring-primary-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Hypothetical Terminations</label>
            <input
              type="text"
              placeholder="Search employees to terminate..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 mb-2 border bg-transparent border-slate-300 dark:border-slate-600 rounded-md focus:ring-primary-500"
            />
            <div className="w-full h-48 p-2 border bg-transparent border-slate-300 dark:border-slate-600 rounded-md overflow-y-auto">
              {filteredEmployees.map(e => (
                <label key={e.employeeId} className="flex items-center justify-between p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700">
                  <span className="text-sm text-slate-800 dark:text-slate-200">{e.employeeNameEnglish} ({e.employeeId})</span>
                  <input
                    type="checkbox"
                    checked={terminatedEmployees.includes(e.employeeId)}
                    onChange={() => toggleTermination(e.employeeId)}
                    className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  />
                </label>
              ))}
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">Projected Impact</h3>
          <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-700 text-xs uppercase text-slate-600 dark:text-slate-300">
                    <tr>
                        <th className="py-2 px-4 text-left">Metric</th>
                        <th className="py-2 px-4 text-center">Current</th>
                        <th className="py-2 px-4 text-center">Simulated</th>
                    </tr>
                </thead>
                <tbody className="text-slate-700 dark:text-slate-200">
                    <ResultRow label="Saudi Employees" current={currentNitaqat.rawSaudiCount ?? 0} simulated={simulatedMetrics.saudi} />
                    <ResultRow label="Non-Saudi Employees" current={(employees.length - (currentNitaqat.rawSaudiCount ?? 0))} simulated={simulatedMetrics.nonSaudi} />
                    <ResultRow label="Total Employees" current={employees.length} simulated={simulatedMetrics.total} />
                    <ResultRow label="Saudization Rate" current={`${currentNitaqat.saudizationRate.toFixed(2)}%`} simulated={`${simulatedNitaqat.saudizationRate.toFixed(2)}%`} highlight />
                    <ResultRow label="Nitaqat Status" current={currentNitaqat.status} simulated={simulatedNitaqat.status} highlight />
                    <ResultRow label="Total Monthly Salaries (SAR)" current={nf.format(currentMetrics.totalSalary)} simulated={nf.format(simulatedMetrics.totalSalary)} highlight />
                </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
