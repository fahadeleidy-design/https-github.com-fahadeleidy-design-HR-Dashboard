import React from 'react';
import { ChartDataPoint } from '../types';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560'];

interface NationalityChartProps {
  data: ChartDataPoint[];
}

export const NationalityChart: React.FC<NationalityChartProps> = ({ data }) => {
    const Recharts = (window as any).Recharts;

    if (!Recharts) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 h-[400px] flex items-center justify-center">
                <p className="text-slate-500">Loading Chart Library...</p>
            </div>
        );
    }
    
    const { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } = Recharts;

    return (
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 h-[400px]">
        <h3 className="text-xl font-bold text-slate-800 mb-4">Nationality Distribution</h3>
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
                {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
            </Pie>
            <Tooltip formatter={(value: number) => [value, 'Employees']} />
            <Legend />
            </PieChart>
        </ResponsiveContainer>
        </div>
    );
};

interface DepartmentChartProps {
  data: ChartDataPoint[];
}

export const DepartmentChart: React.FC<DepartmentChartProps> = ({ data }) => {
    const Recharts = (window as any).Recharts;

    if (!Recharts) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 h-[400px] flex items-center justify-center">
                <p className="text-slate-500">Loading Chart Library...</p>
            </div>
        );
    }
    
    const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } = Recharts;

    return (
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 h-[400px]">
        <h3 className="text-xl font-bold text-slate-800 mb-4">Employees by Department</h3>
        <ResponsiveContainer width="100%" height="90%">
            <BarChart
            data={data}
            margin={{
                top: 5, right: 20, left: -10, bottom: 5,
            }}
            >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} />
            <Tooltip cursor={{fill: 'rgba(239, 246, 255, 0.5)'}} formatter={(value: number) => [value, 'Employees']} />
            <Bar dataKey="value" fill="#3B82F6" barSize={30} />
            </BarChart>
        </ResponsiveContainer>
        </div>
    );
};
