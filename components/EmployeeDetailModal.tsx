import React, { useState, useEffect } from 'react';
import { Employee } from '../types';

const formatDateForInput = (date: Date | null): string => {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
};

const formatDate = (date: Date | null): string => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-CA');
};

export const EmployeeDetailModal: React.FC<{ employee: Employee; onClose: () => void; onUpdateEmployee: (employee: Employee) => void; }> = ({ employee, onClose, onUpdateEmployee }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedEmployee, setEditedEmployee] = useState<Employee>(employee);

  useEffect(() => {
    setEditedEmployee(employee);
  }, [employee]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditedEmployee(prev => ({ ...prev, [name]: value }));
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
      
      setEditedEmployee(prev => ({
          ...prev,
          [parentKey]: {
              ...prev[parentKey],
              [name]: finalValue,
          }
      }));
  };

  const handleSave = () => {
      onUpdateEmployee(editedEmployee);
      setIsEditing(false);
  };
  
  const handleCancel = () => {
    setEditedEmployee(employee);
    setIsEditing(false);
  };

  const DetailItem: React.FC<{ label: string; value: React.ReactNode, isRtl?: boolean }> = ({ label, value, isRtl = false }) => (
    <div className="py-2">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`text-md font-semibold text-slate-800 dark:text-slate-100 ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>{value || 'N/A'}</p>
    </div>
  );

  const EditItem: React.FC<{ label: string; name: string; value: any; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void; type?: string; options?: string[] }> = ({ label, name, value, onChange, type = 'text', options }) => (
    <div>
        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{label}</label>
        {type === 'select' ? (
            <select name={name} value={value || ''} onChange={onChange} className="w-full p-2 border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-md">
                {options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
        ) : (
            <input type={type} name={name} value={value || ''} onChange={onChange} className="w-full p-2 border bg-transparent border-slate-300 dark:border-slate-600 rounded-md"/>
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
        onClick={handleCancel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="employee-detail-title"
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center">
          <h2 id="employee-detail-title" className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {isEditing ? `Editing ${employee.employeeNameEnglish}` : employee.employeeNameEnglish}
          </h2>
          <div className="flex items-center gap-4">
             {isEditing ? (
                <>
                    <button onClick={handleCancel} className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100">Cancel</button>
                    <button onClick={handleSave} className="text-sm font-semibold bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Save Changes</button>
                </>
             ) : (
                <>
                    <button onClick={() => setIsEditing(true)} className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">Edit</button>
                    <button 
                        onClick={onClose} 
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        aria-label="Close employee detail view"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </>
             )}
          </div>
        </header>

        <main className="p-6 overflow-y-auto">
          {isEditing ? (
             <div className="space-y-6">
                 <Section title="Personal & Employment Details">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <EditItem label="Employee ID" name="employeeId" value={editedEmployee.employeeId} onChange={handleInputChange} />
                        <EditItem label="Name (English)" name="employeeNameEnglish" value={editedEmployee.employeeNameEnglish} onChange={handleInputChange} />
                        <EditItem label="Name (Arabic)" name="employeeNameArabic" value={editedEmployee.employeeNameArabic} onChange={handleInputChange} />
                        <EditItem label="Nationality" name="nationality" value={editedEmployee.nationality} onChange={handleInputChange} />
                        <EditItem label="Department" name="department" value={editedEmployee.department} onChange={handleInputChange} />
                        <EditItem label="Job Title" name="jobTitle" value={editedEmployee.jobTitle} onChange={handleInputChange} />
                        <EditItem label="Status" name="status" value={editedEmployee.status} onChange={handleInputChange} type="select" options={['Active', 'Inactive', 'On Leave']} />
                        <EditItem label="Date of Joining" name="dateOfJoining" value={formatDateForInput(editedEmployee.dateOfJoining)} onChange={(e) => setEditedEmployee(prev => ({...prev, dateOfJoining: e.target.value ? new Date(e.target.value) : null}))} type="date" />
                    </div>
                 </Section>
                 <Section title="Document Information">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <EditItem label="GOSI Number" name="gosiNumber" value={editedEmployee.gosi.gosiNumber} onChange={e => handleNestedInputChange(e, 'gosi')} />
                        <EditItem label="Iqama Number" name="iqamaNumber" value={editedEmployee.visa.iqamaNumber} onChange={e => handleNestedInputChange(e, 'visa')} />
                        <EditItem label="Iqama Issue Date" name="iqamaIssueDate" value={formatDateForInput(editedEmployee.visa.iqamaIssueDate)} onChange={e => handleNestedInputChange(e, 'visa')} type="date" />
                        <EditItem label="Iqama Expiry Date" name="iqamaExpiryDate" value={formatDateForInput(editedEmployee.visa.iqamaExpiryDate)} onChange={e => handleNestedInputChange(e, 'visa')} type="date" />
                        <EditItem label="Passport Number" name="passportNumber" value={editedEmployee.passportNumber} onChange={handleInputChange} />
                        <EditItem label="Passport Issue Date" name="passportIssueDate" value={formatDateForInput(editedEmployee.passportIssueDate)} onChange={(e) => setEditedEmployee(prev => ({...prev, passportIssueDate: e.target.value ? new Date(e.target.value) : null}))} type="date" />
                        <EditItem label="Passport Expiry Date" name="passportExpiryDate" value={formatDateForInput(editedEmployee.passportExpiryDate)} onChange={(e) => setEditedEmployee(prev => ({...prev, passportExpiryDate: e.target.value ? new Date(e.target.value) : null}))} type="date" />
                    </div>
                </Section>
                <Section title="Contract & Sponsor Details">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <EditItem label="Sponsor Name" name="sponsorName" value={editedEmployee.sponsorName} onChange={handleInputChange} />
                        <EditItem label="Contract Type" name="contractType" value={editedEmployee.contract.contractType} onChange={e => handleNestedInputChange(e, 'contract')} type="select" options={['fixed', 'indefinite', 'temporary']} />
                        <EditItem label="Contract Start" name="startDate" value={formatDateForInput(editedEmployee.contract.startDate)} onChange={e => handleNestedInputChange(e, 'contract')} type="date" />
                        <EditItem label="Contract End" name="endDate" value={formatDateForInput(editedEmployee.contract.endDate)} onChange={e => handleNestedInputChange(e, 'contract')} type="date" />
                        <EditItem label="Basic Salary (SAR)" name="basicSalary" value={editedEmployee.payroll.basicSalary} onChange={e => handleNestedInputChange(e, 'payroll')} type="number" />
                    </div>
                </Section>
             </div>
          ) : (
            <div className="space-y-6">
                <Section title="Personal & Employment Details">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4">
                    <DetailItem label="Employee ID" value={employee.employeeId} />
                    <DetailItem label="Name (English)" value={employee.employeeNameEnglish} />
                    <DetailItem label="Name (Arabic)" value={employee.employeeNameArabic} isRtl />
                    <DetailItem label="Nationality" value={employee.nationality} />
                    <DetailItem label="Department" value={employee.department} />
                    <DetailItem label="Job Title" value={employee.jobTitle} />
                    <DetailItem label="Status" value={<span className={`px-2 py-1 text-xs font-medium rounded-full ${employee.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>{employee.status}</span>} />
                    <DetailItem label="Date of Joining" value={formatDate(employee.dateOfJoining)} />
                </div>
                </Section>

                <Section title="Document Information">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4">
                    <DetailItem label="GOSI Number" value={employee.gosi.gosiNumber} />
                    <DetailItem label="Iqama Number" value={employee.visa.iqamaNumber} />
                    <DetailItem label="Iqama Issue Date" value={formatDate(employee.visa.iqamaIssueDate)} />
                    <DetailItem label="Iqama Expiry Date" value={formatDate(employee.visa.iqamaExpiryDate)} />
                    <DetailItem label="Passport Number" value={employee.passportNumber} />
                    <DetailItem label="Passport Issue Date" value={formatDate(employee.passportIssueDate)} />
                    <DetailItem label="Passport Expiry Date" value={formatDate(employee.passportExpiryDate)} />
                </div>
                </Section>
                
                <Section title="Contract & Sponsor Details">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4">
                        <DetailItem label="Sponsor Name" value={employee.sponsorName} />
                        <DetailItem label="Contract Type" value={employee.contract.contractType} />
                        <DetailItem label="Contract Start" value={formatDate(employee.contract.startDate)} />
                        <DetailItem label="Contract End" value={formatDate(employee.contract.endDate)} />
                        <DetailItem label="Basic Salary (SAR)" value={employee.payroll.basicSalary?.toLocaleString()}/>
                    </div>
                </Section>

                <Section title="Contact Information">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4">
                        <DetailItem label="Email Address" value={employee.email} />
                        <DetailItem label="Mobile Number" value={employee.mobileNumber} />
                    </div>
                </Section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};