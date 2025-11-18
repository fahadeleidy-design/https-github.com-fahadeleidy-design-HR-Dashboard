import React, { useState, useMemo } from 'react';
import { Employee, RuleDefinition, NitaqatInfo } from '../types';
import { NitaqatStatusCard } from './NitaqatStatusCard';
import { SaudizationSimulator } from './SaudizationSimulator';

interface SaudizationDashboardProps {
  employees: Employee[];
  nitaqatRule: RuleDefinition;
  // Fix: Add `lang` to calculationFn signature
  calculationFn: (saudiCount: number, totalCount: number, sector: string, rule: RuleDefinition, lang: 'en' | 'ar') => NitaqatInfo;
  lang: 'en' | 'ar';
}

export const SaudizationDashboard: React.FC<SaudizationDashboardProps> = ({ employees, nitaqatRule, calculationFn, lang }) => {
  const [sector, setSector] = useState<string>('trading');
  const sectorOptions = useMemo(() => Object.keys(nitaqatRule.parameters.sectorAdjustments), [nitaqatRule]);

  const nitaqatInfo = useMemo(() => {
    const saudiCount = employees.filter(e => e.isSaudi).length;
    const totalCount = employees.length;
    // Fix: Pass `lang` to calculation function
    return calculationFn(saudiCount, totalCount, sector, nitaqatRule, lang);
  }, [employees, nitaqatRule, calculationFn, sector, lang]);

  if (employees.length === 0) {
    return (
      <div className="text-center p-10 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Saudization Dashboard</h2>
        <p className="mt-2 text-slate-500 dark:text-slate-400">Please upload employee data to view the Saudization analysis.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
            <label htmlFor="sector-select" className="text-sm font-medium text-slate-700 dark:text-slate-300 flex-shrink-0">Select Industry Sector:</label>
            <select
            id="sector-select"
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="p-2 border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 transition w-full sm:w-auto text-sm"
            >
            {sectorOptions.map(s => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
        </div>
        <NitaqatStatusCard
            nitaqatInfo={nitaqatInfo}
        />
        <SaudizationSimulator
            employees={employees}
            nitaqatRule={nitaqatRule}
            calculationFn={calculationFn}
            sector={sector}
            lang={lang}
        />
    </div>
  );
};