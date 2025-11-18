import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
  // FIX: Add colSpan property to allow the component to span multiple grid columns.
  colSpan?: number;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, onClick, colSpan }) => {
  const isClickable = !!onClick;
  
  const colSpanClass = colSpan === 2 ? 'sm:col-span-2' : '';

  const cardClasses = `
    bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center space-x-4 
    ${isClickable ? 'cursor-pointer transition-all hover:shadow-md hover:-translate-y-1' : ''}
    ${colSpanClass}
  `;

  return (
    <div className={cardClasses} onClick={onClick}>
      <div className={`rounded-full p-3 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{title}</p>
        <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
      </div>
    </div>
  );
};
