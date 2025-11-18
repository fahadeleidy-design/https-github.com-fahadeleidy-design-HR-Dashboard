import React, { useMemo } from 'react';
import { Employee, Vehicle, GovernmentalDocument } from '../types';

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

// FIX: Add govDocs to props to handle governmental document alerts.
export const ComplianceAlerts: React.FC<{ employees: Employee[]; vehicles: Vehicle[]; govDocs: GovernmentalDocument[] }> = ({ employees, vehicles, govDocs }) => {
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

    const expiringInsurance = vehicles
        .filter(v => daysUntil(v.insurance.endDate) >= 0 && daysUntil(v.insurance.endDate) <= 30)
        .sort((a, b) => daysUntil(a.insurance.endDate) - daysUntil(b.insurance.endDate));
    
    const expiringInspection = vehicles
        .filter(v => daysUntil(v.inspection.endDate) >= 0 && daysUntil(v.inspection.endDate) <= 30)
        .sort((a, b) => daysUntil(a.inspection.endDate) - daysUntil(b.inspection.endDate));
    
    const expiringRegistration = vehicles
        .filter(v => daysUntil(v.registration.endDate) >= 0 && daysUntil(v.registration.endDate) <= 30)
        .sort((a, b) => daysUntil(a.registration.endDate) - daysUntil(b.registration.endDate));
    
    // FIX: Calculate alerts for expiring governmental documents.
    const expiringGovDocs = govDocs
        .filter(d => daysUntil(d.expiryDate) >= 0 && daysUntil(d.expiryDate) <= 30)
        .sort((a, b) => daysUntil(a.expiryDate) - daysUntil(b.expiryDate));

    return {
      expiringIqamas,
      expiringContracts,
      expiringInsurance,
      expiringInspection,
      expiringRegistration,
      expiringGovDocs
    };
  }, [employees, vehicles, govDocs]);

  const AlertItem: React.FC<{ title: string, subtitle: string; date: Date | null }> = ({ title, subtitle, date }) => {
      const days = daysUntil(date);
      const urgencyColor = days < 0 ? 'text-red-700 dark:text-red-400 font-bold' : days <= 15 ? 'text-red-600 dark:text-red-400' : days <= 30 ? 'text-yellow-600 dark:text-yellow-400' : 'text-slate-600 dark:text-slate-300';
      return (
        <li className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700 last:border-b-0">
            <div>
                <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">{title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle} | Expires: {formatDate(date)}</p>
            </div>
            <span className={`text-sm font-bold ${urgencyColor}`}>{days < 0 ? 'Expired' : `${days} days`}</span>
        </li>
      );
  };
  
  const AlertList: React.FC<{ title: string; icon: React.ReactNode; items: any[]; renderItem: (item: any) => React.ReactNode }> = ({ title, icon, items, renderItem }) => (
    <div className="flex-1 min-w-[280px]">
        <div className="flex items-center space-x-2 mb-3">
            {icon}
            <h3 className="font-bold text-slate-700 dark:text-slate-200">{title} ({items.length})</h3>
        </div>
        {items.length > 0 ? (
            <ul className="space-y-1 max-h-60 overflow-y-auto pr-2">
                {items.map(renderItem)}
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
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Compliance Alerts</h2>
      <div className="flex flex-wrap gap-8">
          <AlertList
              title="Iqama Expiry (90 Days)"
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>}
              items={alerts.expiringIqamas}
              renderItem={(emp) => <AlertItem key={emp.id} title={emp.employeeNameEnglish} subtitle={`ID: ${emp.employeeId}`} date={emp.visa.iqamaExpiryDate} />}
          />
          <AlertList
              title="Contract Renewals (90 Days)"
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>}
              items={alerts.expiringContracts}
              renderItem={(emp) => <AlertItem key={emp.id} title={emp.employeeNameEnglish} subtitle={`ID: ${emp.employeeId}`} date={emp.contract.endDate} />}
          />
           <AlertList
              title="Vehicle Insurance (30 Days)"
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m0 6l-2-2-4 4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
              items={alerts.expiringInsurance}
              renderItem={(v) => <AlertItem key={v.id} title={v.make + ' ' + v.model} subtitle={`Plate: ${v.plateNumber}`} date={v.insurance.endDate} />}
          />
           <AlertList
              title="Vehicle Inspection (30 Days)"
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
              items={alerts.expiringInspection}
              renderItem={(v) => <AlertItem key={v.id} title={v.make + ' ' + v.model} subtitle={`Plate: ${v.plateNumber}`} date={v.inspection.endDate} />}
          />
           <AlertList
              title="Vehicle Registration (30 Days)"
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0h4" /></svg>}
              items={alerts.expiringRegistration}
              renderItem={(v) => <AlertItem key={v.id} title={v.make + ' ' + v.model} subtitle={`Plate: ${v.plateNumber}`} date={v.registration.endDate} />}
          />
          {/* FIX: Add AlertList for expiring governmental documents */}
          <AlertList
              title="Governmental Docs (30 Days)"
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
              items={alerts.expiringGovDocs}
              renderItem={(doc) => <AlertItem key={doc.id} title={doc.documentName} subtitle={`Number: ${doc.documentNumber}`} date={doc.expiryDate} />}
          />
      </div>
    </div>
  );
};