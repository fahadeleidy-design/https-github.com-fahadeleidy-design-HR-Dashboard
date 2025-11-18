import { useState, useEffect, useCallback } from 'react';
import { Employee } from '../types';

const STORAGE_KEY = 'hr_dashboard_employees';

export const usePersistentEmployees = (): {
  employees: Employee[];
  addEmployee: (employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateEmployee: (employee: Employee) => void;
  deleteEmployee: (employeeId: string) => void;
  setAllEmployees: (employees: Employee[]) => void;
  loading: boolean;
} => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedEmployees = localStorage.getItem(STORAGE_KEY);
      if (storedEmployees) {
        // Revive dates from strings
        const parsed = JSON.parse(storedEmployees).map((emp: any) => ({
            ...emp,
            dateOfJoining: emp.dateOfJoining ? new Date(emp.dateOfJoining) : null,
            dateOfExit: emp.dateOfExit ? new Date(emp.dateOfExit) : null,
            contract: {
                ...emp.contract,
                startDate: emp.contract?.startDate ? new Date(emp.contract.startDate) : null,
                endDate: emp.contract?.endDate ? new Date(emp.contract.endDate) : null,
            },
            visa: {
                ...emp.visa,
                iqamaIssueDate: emp.visa?.iqamaIssueDate ? new Date(emp.visa.iqamaIssueDate) : null,
                iqamaExpiryDate: emp.visa?.iqamaExpiryDate ? new Date(emp.visa.iqamaExpiryDate) : null,
            },
            passportIssueDate: emp.passportIssueDate ? new Date(emp.passportIssueDate) : null,
            passportExpiryDate: emp.passportExpiryDate ? new Date(emp.passportExpiryDate) : null,
            payroll: {
                ...emp.payroll,
                loanInfo: emp.payroll?.loanInfo?.startDate ? {
                    ...emp.payroll.loanInfo,
                    startDate: new Date(emp.payroll.loanInfo.startDate),
                } : undefined,
            }
        }));
        setEmployees(parsed);
      }
    } catch (error) {
      console.error('Failed to load employees from localStorage', error);
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
    } catch (error) {
      console.error('Failed to save employees to localStorage', error);
    }
  }, [employees]);

  const addEmployee = useCallback((newEmployeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newEmployee: Employee = {
      ...newEmployeeData,
      id: newEmployeeData.employeeId || `EMP-${Date.now()}`, // Ensure ID is unique
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEmployees(prev => [...prev, newEmployee]);
  }, []);

  const updateEmployee = useCallback((updatedEmployee: Employee) => {
    setEmployees(prev =>
      prev.map(emp =>
        emp.id === updatedEmployee.id
          ? { ...updatedEmployee, updatedAt: new Date().toISOString() }
          : emp
      )
    );
  }, []);

  const deleteEmployee = useCallback((employeeId: string) => {
    setEmployees(prev => prev.filter(emp => emp.id !== employeeId));
  }, []);

  const setAllEmployees = useCallback((newEmployees: Employee[]) => {
    setEmployees(newEmployees);
  }, []);

  return { employees, addEmployee, updateEmployee, deleteEmployee, setAllEmployees, loading };
};