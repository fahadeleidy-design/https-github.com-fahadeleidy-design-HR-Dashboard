import React, { useMemo } from 'react';
import { Employee } from '../types';

interface ComplianceAlertsProps {
  employees: Employee[];
}

const formatDate = (date: Date | null) => {
  if (!date) return 'N/A';
  return date.toLocaleDateString('en-CA'); // YYYY-MM-DD for consistency
};

const daysUntil = (date: Date | null): number => {
    if (!date) return Infinity;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today's date
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const diffTime = targetDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const ComplianceAlerts: React.FC<ComplianceAlertsProps> = ({ employees }) => {
  const alerts = useMemo(() => {
    const expiringIqamas = employees
      .filter(e => {
        const days = daysUntil(e.iqamaExpiryDate);
        return days >= 0 && days <= 90;
      })
      .sort((a, b) => daysUntil(a.iqamaExpiryDate) - daysUntil(b.iqamaExpiryDate));

    const expiringContracts = employees
      .filter(e => {
        const days = daysUntil(e.contractEndDate);
        // Corrected logic: Track any contract that is NOT indefinite.
        return !String(e.contractType).toLowerCase().includes('indefinite') && days >= 0 && days <= 90;
      })
      .sort((a, b) => daysUntil(a.contractEndDate) - daysUntil(b.contractEndDate));

    return { expiringIqamas, expiringContracts };
  }, [employees]);

  const AlertItem: React.FC<{ employee: Employee; days: number; date: Date | null }> = ({ employee, days, date }) => {
      const urgencyColor = days <= 30 ? 'text-red-600' : days <= 60 ? 'text-yellow-600' : 'text-slate-600';
      return (
        <li className="flex justify-between items-center py-2 border-b border-slate-100 last:border-b-0">
            <div>
                <p className="font-semibold text-sm text-slate-800">{employee.employeeNameEnglish}</p>
                <p className="text-xs text-slate-500">ID: {employee.employeeId} | Expires: {formatDate(date)}</p>
            </div>
            <span className={`text-sm font-bold ${urgencyColor}`}>{days} days</span>
        </li>
      );
  };
  
  const renderAlertList = (title: string, icon: React.ReactNode, alertItems: Employee[], dateField: 'iqamaExpiryDate' | 'contractEndDate') => (
      <div className="flex-1 min-w-[280px]">
          <div className="flex items-center space-x-2 mb-3">
              {icon}
              <h3 className="font-bold text-slate-700">{title} ({alertItems.length})</h3>
          </div>
          {alertItems.length > 0 ? (
              <ul className="space-y-1 max-h-60 overflow-y-auto pr-2">
                  {alertItems.map(emp => {
                      const date = emp[dateField];
                      const days = daysUntil(date);
                      return <AlertItem key={emp.employeeId + dateField} employee={emp} days={days} date={date} />;
                  })}
              </ul>
          ) : (
              <div className="flex flex-col items-center justify-center h-48 bg-slate-50 rounded-lg text-center p-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-semibold text-slate-600">No urgent actions</p>
                  <p className="text-xs text-slate-500">All items are up to date.</p>
              </div>
          )}
      </div>
  );

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
      <h2 className="text-xl font-bold text-slate-800 mb-4">Compliance Alerts (Next 90 Days)</h2>
      <div className="flex flex-col md:flex-row gap-8">
          {renderAlertList(
              "Iqama Expiry",
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>,
              alerts.expiringIqamas,
              'iqamaExpiryDate'
          )}
          {renderAlertList(
              "Contract Renewals",
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>,
              alerts.expiringContracts,
              'contractEndDate'
          )}
      </div>
    </div>
  );
};