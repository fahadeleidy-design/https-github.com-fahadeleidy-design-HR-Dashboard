import React, { useState, useEffect, useCallback } from 'react';
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
                        {employees.map((emp) => {
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
                                            className="w-20 p-1 text-center font-bold text-blue-600 dark:text-blue-400 bg-transparent border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500"
                                            aria-label={`Leave balance for ${emp.employeeNameEnglish}`}
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                        {employees.length === 0 && (
                            <tr>
                                <td colSpan={4} className="text-center py-10 text-slate-500 dark:text-slate-400">
                                    No employee data to display.
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