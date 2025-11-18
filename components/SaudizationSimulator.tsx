import React, { useState, useMemo } from 'react';
import { Employee, RuleDefinition, NitaqatInfo } from '../types';

interface SaudizationSimulatorProps {
  employees: Employee[];
  nitaqatRule: RuleDefinition;
  // Fix: Add `lang` to calculationFn signature
  calculationFn: (saudiCount: number, totalCount: number, sector: string, rule: RuleDefinition, lang: 'en' | 'ar') => NitaqatInfo;
  sector: string;
  lang: 'en' | 'ar';
}

export const SaudizationSimulator: React.FC<SaudizationSimulatorProps> = ({ employees, nitaqatRule, calculationFn, sector, lang }) => {
  const [newSaudiHires, setNewSaudiHires] = useState<number | ''>(0);
  const [newNonSaudiHires, setNewNonSaudiHires] = useState<number | ''>(0);
  const [terminatedEmployees, setTerminatedEmployees] = useState<string[]>([]);

  const currentCounts = useMemo(() => ({
    saudi: employees.filter(e => e.isSaudi).length,
    nonSaudi: employees.filter(e => !e.isSaudi).length,
    total: employees.length,
  }), [employees]);

  const simulatedCounts = useMemo(() => {
    const termSaudi = employees.filter(e => terminatedEmployees.includes(e.employeeId) && e.isSaudi).length;
    const termNonSaudi = employees.filter(e => terminatedEmployees.includes(e.employeeId) && !e.isSaudi).length;

    const saudi = currentCounts.saudi + Number(newSaudiHires) - termSaudi;
    const nonSaudi = currentCounts.nonSaudi + Number(newNonSaudiHires) - termNonSaudi;
    
    return {
      saudi: Math.max(0, saudi),
      nonSaudi: Math.max(0, nonSaudi),
      total: Math.max(0, saudi + nonSaudi),
    };
  }, [employees, newSaudiHires, newNonSaudiHires, terminatedEmployees, currentCounts]);

  // Fix: Pass `lang` to calculation function
  const currentNitaqat = calculationFn(currentCounts.saudi, currentCounts.total, sector, nitaqatRule, lang);
  const simulatedNitaqat = calculationFn(simulatedCounts.saudi, simulatedCounts.total, sector, nitaqatRule, lang);

  const ResultRow: React.FC<{ label: string; current: string | number; simulated: string | number; highlight?: boolean }> = ({ label, current, simulated, highlight }) => (
    <tr className="border-b border-slate-200 dark:border-slate-700 last:border-b-0">
        <td className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">{label}</td>
        <td className="py-3 px-4 text-center">{current}</td>
        <td className={`py-3 px-4 text-center font-bold ${highlight ? 'text-blue-600 dark:text-blue-400' : ''}`}>{simulated}</td>
    </tr>
  );

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Saudization Simulator</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">New Hires</label>
            <div className="flex gap-2">
              <input type="number" placeholder="Saudi" value={newSaudiHires} onChange={e => setNewSaudiHires(e.target.value === '' ? '' : parseInt(e.target.value))} className="w-full p-2 border bg-transparent border-slate-300 dark:border-slate-600 rounded-md" />
              <input type="number" placeholder="Non-Saudi" value={newNonSaudiHires} onChange={e => setNewNonSaudiHires(e.target.value === '' ? '' : parseInt(e.target.value))} className="w-full p-2 border bg-transparent border-slate-300 dark:border-slate-600 rounded-md" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Hypothetical Terminations</label>
            <select
                multiple
                value={terminatedEmployees}
                onChange={e => setTerminatedEmployees(Array.from(e.target.selectedOptions, option => option.value))}
                className="w-full h-40 p-2 border bg-transparent border-slate-300 dark:border-slate-600 rounded-md"
            >
                {employees.map(e => (
                    <option key={e.employeeId} value={e.employeeId}>{e.employeeNameEnglish} ({e.employeeId})</option>
                ))}
            </select>
             <p className="text-xs text-slate-500 mt-1">Hold Ctrl/Cmd to select multiple employees.</p>
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
                    <ResultRow label="Saudi Employees" current={currentCounts.saudi} simulated={simulatedCounts.saudi} />
                    <ResultRow label="Non-Saudi Employees" current={currentCounts.nonSaudi} simulated={simulatedCounts.nonSaudi} />
                    <ResultRow label="Total Employees" current={currentCounts.total} simulated={simulatedCounts.total} />
                    <ResultRow label="Saudization Rate" current={`${currentNitaqat.saudizationRate.toFixed(2)}%`} simulated={`${simulatedNitaqat.saudizationRate.toFixed(2)}%`} highlight />
                    <ResultRow label="Nitaqat Status" current={currentNitaqat.status} simulated={simulatedNitaqat.status} highlight />
                </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};