
import React from 'react';
import { Employee } from '../types';

interface LeaveManagementProps {
  employees: Employee[];
}

const calculateYearsOfService = (joiningDate: Date | null): number => {
    if (!joiningDate) return 0;
    const today = new Date();
    const join = new Date(joiningDate);
    let years = today.getFullYear() - join.getFullYear();
    const m = today.getMonth() - join.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < join.getDate())) {
        years--;
    }
    return years;
};

const getLeaveEntitlement = (yearsOfService: number): number => {
    // Saudi Labor Law: 21 days annually, increases to 30 days after 5 years of continuous service.
    return yearsOfService >= 5 ? 30 : 21;
};

export const LeaveManagement: React.FC<LeaveManagementProps> = ({ employees }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
      <h2 className="text-xl font-bold text-slate-800 mb-4">Annual Leave Entitlement</h2>
       <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-500">
          <thead className="text-xs text-slate-700 uppercase bg-slate-100">
            <tr>
              <th scope="col" className="px-6 py-3">Employee Name</th>
              <th scope="col" className="px-6 py-3">Date of Joining</th>
              <th scope="col" className="px-6 py-3 text-center">Years of Service</th>
              <th scope="col" className="px-6 py-3 text-center">Annual Leave Entitlement (Days)</th>
              <th scope="col" className="px-6 py-3 text-center">Leave Balance (Days)</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => {
              const yearsOfService = calculateYearsOfService(emp.dateOfJoining);
              const entitlement = getLeaveEntitlement(yearsOfService);
              return (
                <tr key={emp.employeeId} className="bg-white border-b hover:bg-slate-50">
                  <td className="px-6 py-4 font-semibold text-slate-800 whitespace-nowrap">{emp.employeeNameEnglish}</td>
                  <td className="px-6 py-4">{emp.dateOfJoining ? new Date(emp.dateOfJoining).toLocaleDateString('en-CA') : 'N/A'}</td>
                  <td className="px-6 py-4 text-center">{yearsOfService}</td>
                  <td className="px-6 py-4 text-center font-medium">{entitlement}</td>
                  <td className="px-6 py-4 text-center font-bold text-blue-600">{entitlement}</td>
                </tr>
              );
            })}
             {employees.length === 0 && (
                <tr>
                    <td colSpan={5} className="text-center py-10 text-slate-500">
                        No employee data to display. Please upload a file.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
       </div>
       <div className="mt-4 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
           <strong>Note:</strong> Leave entitlement is calculated based on Saudi Labor Law. Employees with less than 5 years of service are entitled to 21 days of annual leave. This increases to 30 days for employees with 5 or more years of service. The current balance assumes no leave has been taken yet.
       </div>
    </div>
  );
};
