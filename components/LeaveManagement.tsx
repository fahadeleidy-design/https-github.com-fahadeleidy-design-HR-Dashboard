import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Employee, RuleDefinition } from '../types';
import { loadRules } from '../lib/rulesEngine';

const calculateYearsOfService = (joiningDate: Date | null): number => {
    if (!joiningDate) return 0;
    const today = new Date();
    const join = new Date(joiningDate);
    let years = today.getFullYear() - join.getFullYear();
    const m = today.getMonth() - join.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < join.getDate())) {
        years--;
    }
    return Math.max(0, years);
};

export const LeaveManagement: React.FC<{ employees: Employee[] }> = ({ employees }) => {
    const [leaveBalances, setLeaveBalances] = useState<Record<string, number>>({});
    const [leaveRule, setLeaveRule] = useState<RuleDefinition | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const rules = loadRules();
        const rule = rules.find(r => r.type === 'LEAVE');
        if (rule) {
            setLeaveRule(rule);
        } else {
            console.error("LEAVE Rule not found!");
        }
    }, []);

    const getLeaveEntitlement = useCallback((yearsOfService: number): number => {
        if (!leaveRule) return 21; // Fallback to default if rule not loaded
        const params = leaveRule.parameters.annualLeave;
        return yearsOfService >= params.enhancementAfterYears ? params.enhancedDays : params.baseDays;
    }, [leaveRule]);

    const getInitialBalances = useCallback(() => {
        const initialBalances: Record<string, number> = {};
        employees.forEach(emp => {
            const yearsOfService = calculateYearsOfService(emp.dateOfJoining);
            initialBalances[emp.employeeId] = getLeaveEntitlement(yearsOfService);
        });
        return initialBalances;
    }, [employees, getLeaveEntitlement]);

    useEffect(() => {
        if (leaveRule) {
            setLeaveBalances(getInitialBalances());
        }
    }, [employees, leaveRule, getInitialBalances]);

    const handleBalanceChange = (employeeId: string, newBalance: string) => {
        const balance = parseInt(newBalance, 10);
        if (!isNaN(balance) && balance >= 0) {
            setLeaveBalances(prev => ({
                ...prev,
                [employeeId]: balance,
            }));
        } else if (newBalance === '') {
             setLeaveBalances(prev => ({
                ...prev,
                [employeeId]: 0,
            }));
        }
    };

    const handleResetAll = () => {
        setLeaveBalances(getInitialBalances());
    };
    
    const filteredEmployees = useMemo(() => {
        if (!searchTerm) return employees;
        const lowercasedFilter = searchTerm.toLowerCase();
        return employees.filter(emp =>
          emp.employeeNameEnglish.toLowerCase().includes(lowercasedFilter) ||
          emp.employeeId.toLowerCase().includes(lowercasedFilter)
        );
    }, [employees, searchTerm]);


    if (!leaveRule) {
        return (
             <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                Loading leave rules...
             </div>
        )
    }

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Annual Leave Management</h2>
                <button
                    onClick={handleResetAll}
                    className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                    Reset All Balances
                </button>
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
                            <th scope="col" className="px-6 py-3">Employee Name</th>
                            <th scope="col" className="px-6 py-3 text-center">Entitlement</th>
                            <th scope="col" className="px-6 py-3 text-center">Leave Taken</th>
                            <th scope="col" className="px-6 py-3 text-center">Current Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEmployees.map((emp) => {
                            const yearsOfService = calculateYearsOfService(emp.dateOfJoining);
                            const entitlement = getLeaveEntitlement(yearsOfService);
                            const currentBalance = leaveBalances[emp.employeeId] ?? entitlement;
                            const leaveTaken = entitlement - currentBalance;

                            return (
                                <tr key={emp.employeeId} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">{emp.employeeNameEnglish}</td>
                                    <td className="px-6 py-4 text-center font-medium">{entitlement}</td>
                                    <td className="px-6 py-4 text-center text-red-600 dark:text-red-400">{leaveTaken < 0 ? 0 : leaveTaken}</td>
                                    <td className="px-6 py-4 text-center">
                                        <input
                                            type="number"
                                            value={currentBalance}
                                            onChange={(e) => handleBalanceChange(emp.employeeId, e.target.value)}
                                            className="w-20 p-1 text-center font-bold text-primary-600 dark:text-primary-400 bg-transparent border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-primary-500"
                                            aria-label={`Leave balance for ${emp.employeeNameEnglish}`}
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredEmployees.length === 0 && (
                            <tr>
                                <td colSpan={4} className="text-center py-10 text-slate-500 dark:text-slate-400">
                                    No employees found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="mt-4 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                <strong>Note:</strong> Leave entitlement is calculated based on Saudi Labor Law ({leaveRule.parameters.annualLeave.baseDays} days, or {leaveRule.parameters.annualLeave.enhancedDays} after {leaveRule.parameters.annualLeave.enhancementAfterYears} years of service). You can manually adjust the "Current Balance" for each employee. "Leave Taken" is automatically calculated as Entitlement - Current Balance.
            </div>
        </div>
    );
};