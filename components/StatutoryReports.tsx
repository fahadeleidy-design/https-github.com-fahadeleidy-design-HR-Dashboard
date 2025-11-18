import React, { useMemo, useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Employee, RuleDefinition } from '../types';
import { loadRules, calculateGOSI } from '../lib/rulesEngine';

const nf = new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface GOSIReportRecord {
    employeeId: string;
    employeeName: string;
    nationality: string;
    baseSalary: number;
    housingAllowance: number;
    contributoryWage: number;
    employeeContribution: number;
    employerContribution: number;
    totalContribution: number;
}

export const StatutoryReports: React.FC<{ employees: Employee[] }> = ({ employees }) => {
    const [gosiRule, setGosiRule] = useState<RuleDefinition | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const rules = loadRules();
        setGosiRule(rules.find(r => r.type === 'GOSI') || null);
    }, []);

    const gosiReportData = useMemo((): GOSIReportRecord[] => {
        if (!gosiRule) return [];

        return employees.map(emp => {
            const contributions = calculateGOSI(emp, gosiRule);
            const contributoryWage = Math.min(
                (emp.payroll.basicSalary || 0) + (emp.payroll.housingAllowance || 0),
                gosiRule.parameters.saudi.maxContributoryWage
            );

            return {
                employeeId: emp.employeeId,
                employeeName: emp.employeeNameEnglish,
                nationality: emp.nationality,
                baseSalary: emp.payroll.basicSalary || 0,
                housingAllowance: emp.payroll.housingAllowance || 0,
                contributoryWage: contributoryWage,
                employeeContribution: contributions.employee,
                employerContribution: contributions.employer,
                totalContribution: contributions.employee + contributions.employer,
            };
        });
    }, [employees, gosiRule]);
    
    const filteredGosiData = useMemo(() => {
        if (!searchTerm) return gosiReportData;
        const lowercasedFilter = searchTerm.toLowerCase();
        return gosiReportData.filter(rec =>
            rec.employeeName.toLowerCase().includes(lowercasedFilter) ||
            rec.employeeId.toLowerCase().includes(lowercasedFilter)
        );
    }, [gosiReportData, searchTerm]);

    const totals = useMemo(() => {
        return filteredGosiData.reduce((acc, record) => ({
            employee: acc.employee + record.employeeContribution,
            employer: acc.employer + record.employerContribution,
            total: acc.total + record.totalContribution,
        }), { employee: 0, employer: 0, total: 0 });
    }, [filteredGosiData]);
    
    const handleExportCsv = () => {
        const filename = `gosi_contribution_summary_${new Date().toISOString().split('T')[0]}.csv`;
        const headers = ["Employee ID", "Employee Name", "Nationality", "Contributory Wage", "Employee Contribution", "Employer Contribution", "Total Contribution"];
        
        const csvRows = [
            headers.join(','),
            ...filteredGosiData.map(row => [
                `"${row.employeeId}"`,
                `"${row.employeeName}"`,
                `"${row.nationality}"`,
                row.contributoryWage,
                row.employeeContribution,
                row.employerContribution,
                row.totalContribution
            ].join(','))
        ];

        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
        const blob = new Blob([bom, csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.setAttribute("href", URL.createObjectURL(blob));
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportPdf = () => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("GOSI Contribution Summary", 14, 22);

        autoTable(doc, {
            startY: 30,
            head: [['ID', 'Name', 'Nationality', 'Contributory Wage', 'Employee Share', 'Employer Share', 'Total']],
            body: filteredGosiData.map(r => [
                r.employeeId,
                r.employeeName,
                r.nationality,
                nf.format(r.contributoryWage),
                nf.format(r.employeeContribution),
                nf.format(r.employerContribution),
                nf.format(r.totalContribution)
            ]),
            foot: [[
                { content: 'Totals', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } },
                { content: nf.format(totals.employee), styles: { fontStyle: 'bold' } },
                { content: nf.format(totals.employer), styles: { fontStyle: 'bold' } },
                { content: nf.format(totals.total), styles: { fontStyle: 'bold' } },
            ]],
            theme: 'striped',
            headStyles: { fillColor: [41, 128, 185] },
            footStyles: { fillColor: [220, 220, 220], textColor: [0,0,0] },
             columnStyles: { 
                 3: { halign: 'right' }, 
                 4: { halign: 'right' }, 
                 5: { halign: 'right' }, 
                 6: { halign: 'right' } 
            },
        });
        
        doc.save(`gosi_summary_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    if (!gosiRule) {
        return <div className="p-6">Loading GOSI rules...</div>;
    }

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">GOSI Contribution Summary</h2>
                <div className="flex items-center gap-2">
                    <button onClick={handleExportCsv} className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm">
                        Export to CSV
                    </button>
                    <button onClick={handleExportPdf} className="flex items-center justify-center gap-2 bg-primary-600 text-white font-bold py-2 px-4 rounded-md hover:bg-primary-700 transition-colors text-sm">
                        Export to PDF
                    </button>
                </div>
            </div>

            <div className="relative mb-4">
                <input
                    type="text"
                    placeholder="Search by name or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 pl-10 border bg-transparent border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-primary-500 transition"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                    <thead className="text-xs text-slate-700 dark:text-slate-300 uppercase bg-slate-100 dark:bg-slate-700">
                        <tr>
                            <th className="px-4 py-3">Employee</th>
                            <th className="px-4 py-3 text-right">Contributory Wage</th>
                            <th className="px-4 py-3 text-right">Employee Share</th>
                            <th className="px-4 py-3 text-right">Employer Share</th>
                            <th className="px-4 py-3 text-right">Total Contribution</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredGosiData.map(record => (
                            <tr key={record.employeeId} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                <td className="px-4 py-2">
                                    <div className="font-semibold text-slate-800 dark:text-slate-100">{record.employeeName}</div>
                                    <div className="text-xs text-slate-500">{record.employeeId}</div>
                                </td>
                                <td className="px-4 py-2 text-right">{nf.format(record.contributoryWage)}</td>
                                <td className="px-4 py-2 text-right text-red-600 dark:text-red-400">({nf.format(record.employeeContribution)})</td>
                                <td className="px-4 py-2 text-right">{nf.format(record.employerContribution)}</td>
                                <td className="px-4 py-2 text-right font-medium text-slate-800 dark:text-slate-200">{nf.format(record.totalContribution)}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="font-bold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-700">
                        <tr>
                            <td className="px-4 py-3 text-right" colSpan={2}>Grand Totals</td>
                            <td className="px-4 py-3 text-right text-red-600 dark:text-red-400">({nf.format(totals.employee)})</td>
                            <td className="px-4 py-3 text-right">{nf.format(totals.employer)}</td>
                            <td className="px-4 py-3 text-right">{nf.format(totals.total)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            <div className="mt-4 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                <strong>Note:</strong> GOSI contributions are calculated based on the sum of Basic Salary and Housing Allowance, capped at a maximum contributory wage of SAR {gosiRule.parameters.saudi.maxContributoryWage.toLocaleString()}.
            </div>
        </div>
    );
};