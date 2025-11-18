import React from 'react';
import { ChartDataPoint } from '../types';
import { 
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, 
    BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';

const COLORS = ['#F97316', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6B7280', '#3B82F6'];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-2 bg-slate-800 border border-slate-600 rounded-md shadow-lg text-white">
          <p className="label font-bold">{`${label || payload[0].name} : ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
};

const ChartWrapper: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 h-[400px]">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">{title}</h3>
        {children}
    </div>
);

export const NationalityChart: React.FC<{ data: ChartDataPoint[] }> = ({ data }) => {
    return (
        <ChartWrapper title="Nationality Distribution">
            <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }: { name: string, percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                        {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ color: '#64748B', fontSize: '12px' }} />
                </PieChart>
            </ResponsiveContainer>
        </ChartWrapper>
    );
};

export const DepartmentChart: React.FC<{ data: ChartDataPoint[] }> = ({ data }) => {
    return (
        <ChartWrapper title="Employees by Department">
            <ResponsiveContainer width="100%" height="90%">
                <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.2} stroke="currentColor" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94A3B8' }} interval={0} angle={-30} textAnchor="end" height={70}/>
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#94A3B8' }} />
                    <Tooltip cursor={{ fill: 'rgba(100, 116, 139, 0.1)' }} content={<CustomTooltip />} />
                    <Bar dataKey="value" barSize={30}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </ChartWrapper>
    );
};

export const TenureChart: React.FC<{ data: ChartDataPoint[] }> = ({ data }) => {
    return (
        <ChartWrapper title="Years of Service">
            <ResponsiveContainer width="100%" height="90%">
                <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.2} stroke="currentColor"/>
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94A3B8' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#94A3B8' }} />
                    <Tooltip cursor={{ fill: 'rgba(100, 116, 139, 0.1)' }} content={<CustomTooltip />} />
                    <Bar dataKey="value" fill={COLORS[0]} barSize={40} />
                </BarChart>
            </ResponsiveContainer>
        </ChartWrapper>
    );
};