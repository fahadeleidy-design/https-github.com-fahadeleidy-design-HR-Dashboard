import React, { useState } from 'react';
import { Employee, AddEmployeeModalProps } from '../types';

const formatDateForInput = (date: Date | null): string => {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
};

export const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({ onClose, onAddEmployee }) => {
  const [newEmployee, setNewEmployee] = useState<Partial<Employee>>({
    status: 'Active',
    contract: { contractType: 'indefinite' },
    payroll: {},
    visa: {},
    gosi: {},
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewEmployee(prev => ({ ...prev, [name]: value }));
  };
  
  const handleNestedInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, parentKey: 'contract' | 'visa' | 'gosi' | 'payroll') => {
      let { name, value, type } = e.target;
      let finalValue: any = value;
      if (type === 'date') {
          finalValue = value ? new Date(value) : null;
      }
      if (type === 'number') {
          finalValue = value ? parseFloat(value) : undefined;
      }
      
      setNewEmployee(prev => ({
          ...prev,
          [parentKey]: {
              ...(prev as any)[parentKey],
              [name]: finalValue,
          }
      }));
  };

  const handleSave = () => {
      // Basic validation
      if (!newEmployee.employeeId || !newEmployee.employeeNameEnglish) {
          alert("Employee ID and English Name are required.");
          return;
      }
      onAddEmployee(newEmployee as Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>);
      onClose();
  };
  
  const EditItem: React.FC<{ label: string; name: string; value: any; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void; type?: string; options?: string[]; required?: boolean }> = ({ label, name, value, onChange, type = 'text', options, required = false }) => (
    <div>
        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{label} {required && <span className="text-red-500">*</span>}</label>
        {type === 'select' ? (
            <select name={name} value={value || ''} onChange={onChange} className="w-full p-2 border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-md">
                {options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
        ) : (
            <input type={type} name={name} value={value || ''} onChange={onChange} required={required} className="w-full p-2 border bg-transparent border-slate-300 dark:border-slate-600 rounded-md"/>
        )}
    </div>
  )

  const Section: React.FC<{title: string; children: React.ReactNode}> = ({title, children}) => (
    <div>
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">{title}</h3>
        {children}
    </div>
  )

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-employee-title"
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center">
          <h2 id="add-employee-title" className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Add New Employee
          </h2>
        </header>

        <main className="p-6 overflow-y-auto">
             <div className="space-y-6">
                 <Section title="Personal & Employment Details">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <EditItem label="Employee ID" name="employeeId" value={newEmployee.employeeId} onChange={handleInputChange} required />
                        <EditItem label="Name (English)" name="employeeNameEnglish" value={newEmployee.employeeNameEnglish} onChange={handleInputChange} required />
                        <EditItem label="Name (Arabic)" name="employeeNameArabic" value={newEmployee.employeeNameArabic} onChange={handleInputChange} />
                        <EditItem label="Nationality" name="nationality" value={newEmployee.nationality} onChange={handleInputChange} />
                        <EditItem label="Department" name="department" value={newEmployee.department} onChange={handleInputChange} />
                        <EditItem label="Job Title" name="jobTitle" value={newEmployee.jobTitle} onChange={handleInputChange} />
                        <EditItem label="Status" name="status" value={newEmployee.status} onChange={handleInputChange} type="select" options={['Active', 'Inactive', 'On Leave']} />
                        <EditItem label="Date of Joining" name="dateOfJoining" value={formatDateForInput(newEmployee.dateOfJoining as Date | null)} onChange={(e) => setNewEmployee(prev => ({...prev, dateOfJoining: e.target.value ? new Date(e.target.value) : null}))} type="date" />
                    </div>
                 </Section>
                 <Section title="Document Information">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <EditItem label="GOSI Number" name="gosiNumber" value={newEmployee.gosi?.gosiNumber} onChange={e => handleNestedInputChange(e, 'gosi')} />
                        <EditItem label="Iqama Number" name="iqamaNumber" value={newEmployee.visa?.iqamaNumber} onChange={e => handleNestedInputChange(e, 'visa')} />
                        <EditItem label="Iqama Issue Date" name="iqamaIssueDate" value={formatDateForInput(newEmployee.visa?.iqamaIssueDate)} onChange={e => handleNestedInputChange(e, 'visa')} type="date" />
                        <EditItem label="Iqama Expiry Date" name="iqamaExpiryDate" value={formatDateForInput(newEmployee.visa?.iqamaExpiryDate)} onChange={e => handleNestedInputChange(e, 'visa')} type="date" />
                        <EditItem label="Passport Number" name="passportNumber" value={newEmployee.passportNumber} onChange={handleInputChange} />
                    </div>
                </Section>
                <Section title="Contract & Sponsor Details">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <EditItem label="Sponsor Name" name="sponsorName" value={newEmployee.sponsorName} onChange={handleInputChange} />
                        <EditItem label="Contract Type" name="contractType" value={newEmployee.contract?.contractType} onChange={e => handleNestedInputChange(e, 'contract')} type="select" options={['fixed', 'indefinite', 'temporary']} />
                        <EditItem label="Contract Start" name="startDate" value={formatDateForInput(newEmployee.contract?.startDate)} onChange={e => handleNestedInputChange(e, 'contract')} type="date" />
                        <EditItem label="Contract End" name="endDate" value={formatDateForInput(newEmployee.contract?.endDate)} onChange={e => handleNestedInputChange(e, 'contract')} type="date" />
                        <EditItem label="Basic Salary (SAR)" name="basicSalary" value={newEmployee.payroll?.basicSalary} onChange={e => handleNestedInputChange(e, 'payroll')} type="number" />
                    </div>
                </Section>
             </div>
        </main>
        <footer className="px-6 py-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
             <button onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-100 font-semibold rounded-md hover:bg-slate-300 dark:hover:bg-slate-500">Cancel</button>
             <button onClick={handleSave} className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-md hover:bg-primary-700">Add Employee</button>
        </footer>
      </div>
    </div>
  );
};