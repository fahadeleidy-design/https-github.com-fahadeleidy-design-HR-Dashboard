import React, { useMemo } from 'react';
import { Employee } from '../types';

const formatDate = (date: Date | null): string => {
  if (!date) return 'N/A';
  return date.toLocaleDateString('en-CA'); // YYYY-MM-DD
};

const daysUntil = (date: Date | null): number => {
    if (!date) return Infinity;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const diffTime = targetDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const ComplianceAlerts: React.FC<{ employees: Employee[] }> = ({ employees }) => {
  const alerts = useMemo(() => {
    const expiringIqamas = employees
      .filter(e => {
        const days = daysUntil(e.visa?.iqamaExpiryDate);
        return days >= 0 && days <= 90;
      })
      .sort((a, b) => daysUntil(a.visa?.iqamaExpiryDate) - daysUntil(b.visa?.iqamaExpiryDate));

    const expiringContracts = employees
      .filter(e => {
        if (String(e.contract?.contractType).toLowerCase().includes('indefinite')) {
          return false;
        }
        const days = daysUntil(e.contract?.endDate);
        return days >= 0 && days <= 90;
      })
      .sort((a, b) => daysUntil(a.contract?.endDate) - daysUntil(b.contract?.endDate));

    return {
      expiringIqamas,
      expiringContracts,
    };
  }, [employees]);

  const AlertItem: React.FC<{ employee: Employee; date: Date | null }> = ({ employee, date }) => {
      const days = daysUntil(date);
      const urgencyColor = days <= 30 ? 'text-red-600 dark:text-red-400' : days <= 60 ? 'text-yellow-600 dark:text-yellow-400' : 'text-slate-600 dark:text-slate-300';
      return (
        <li className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700 last:border-b-0">
            <div>
                <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">{employee.employeeNameEnglish}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">ID: {employee.employeeId} | Expires: {formatDate(date)}</p>
            </div>
            <span className={`text-sm font-bold ${urgencyColor}`}>{days} days</span>
        </li>
      );
  };
  
  const AlertList: React.FC<{ title: string; icon: React.ReactNode; items: Employee[]; dateField: 'iqama' | 'contract' }> = ({ title, icon, items, dateField }) => (
    <div className="flex-1 min-w-[280px]">
        <div className="flex items-center space-x-2 mb-3">
            {icon}
            <h3 className="font-bold text-slate-700 dark:text-slate-200">{title} ({items.length})</h3>
        </div>
        {items.length > 0 ? (
            <ul className="space-y-1 max-h-60 overflow-y-auto pr-2">
                {items.map(emp => (
                    <AlertItem key={`${emp.employeeId}-${dateField}`} employee={emp} date={dateField === 'iqama' ? emp.visa.iqamaExpiryDate : emp.contract.endDate} />
                ))}
            </ul>
        ) : (
            <div className="flex flex-col items-center justify-center h-48 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-center p-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No urgent actions</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">All items are up to date.</p>
            </div>
        )}
    </div>
  );

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Compliance Alerts (Next 90 Days)</h2>
      <div className="flex flex-col md:flex-row gap-8">
          <AlertList
              title="Iqama Expiry"
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>}
              items={alerts.expiringIqamas}
              dateField='iqama'
          />
          <AlertList
              title="Contract Renewals"
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>}
              items={alerts.expiringContracts}
              dateField='contract'
          />
      </div>
    </div>
  );
};