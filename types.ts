export type Nationality = string;

export interface EmploymentContract {
  contractType: 'fixed' | 'indefinite' | 'temporary' | string;
  startDate?: Date | null;
  endDate?: Date | null;
  probationDays?: number;
  workingHoursPerWeek?: number;
  weeklyOff?: string[]; // e.g., ['Fri', 'Sat']
  salaryCurrency?: string;
}

export interface VisaInfo {
  visaType?: string;
  iqamaNumber?: string;
  iqamaIssueDate?: Date | null;
  iqamaExpiryDate?: Date | null;
  visaStatus?: 'valid' | 'expired' | 'pending' | 'N/A' | string;
}

export interface GOSIInfo {
  registered?: boolean;
  gosiNumber?: string;
  contributionPercent?: number;
}

export interface LoanInfo {
  totalAmount?: number;
  startDate?: Date | null;
  installments?: number;
}

export interface PayrollInfo {
  basicSalary?: number;
  housingAllowance?: number;
  transportationAllowance?: number;
  commission?: number;
  otherAllowances?: number;
  totalSalary?: number;
  taxableSalary?: number;
  loanInfo?: LoanInfo;
  lastPayslipDate?: Date | null;
}

export interface LeaveBalances {
  annual?: number;
  sick?: number;
  maternity?: number;
  paternity?: number;
  unpaid?: number;
}

export interface Employee {
  id: string;
  employeeId: string;
  employeeNameEnglish: string;
  employeeNameArabic: string;
  nationality: Nationality;
  isSaudi: boolean;
  department: string;
  jobTitle: string;
  email: string;
  mobileNumber: string;
  sponsorName: string;
  status: string;
  dateOfJoining: Date | null;
  dateOfExit?: Date | null;
  tenure: number;
  contract: EmploymentContract;
  visa: VisaInfo;
  gosi: GOSIInfo;
  payroll: PayrollInfo;
  leaveBalances?: LeaveBalances;
  passportNumber: string;
  passportIssueDate: Date | null;
  passportExpiryDate: Date | null;
  iban?: string;
  bankName?: string;
  specialCategory?: 'normal' | 'disabled' | 'exConvict' | 'partTime' | 'student' | 'remote' | 'specialNonSaudi' | 'gulfNational' | string;
  isDriver?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type Tab = 'dashboard' | 'directory' | 'saudization' | 'payroll' | 'eosb' | 'leave' | 'reports' | 'ask-ai' | 'loans' | 'vehicles' | 'gov-docs';

// Type for chart data points
export interface ChartDataPoint {
  name: string;
  value: number;
}

// Types for AI Correction Reporting
export interface SkippedRow {
  rowNumber: number;
  originalData: Record<string, any>;
  error: string;
}

export interface CorrectionReport {
  processedCount: number;
  skippedCount: number;
  skippedRows: SkippedRow[];
}

// Types for Rules Engine
export type RuleType = 'EOSB' | 'LEAVE' | 'OVERTIME' | 'NITAQAT' | 'GOSI';
export type TerminationReason = 'resignation' | 'non-renewal' | 'termination';

export interface RuleDefinition {
  id: string;
  version: string;
  type: RuleType;
  description?: string;
  parameters: Record<string, any>;
}

export interface EOSBResult {
    yearsOfService: number;
    totalGratuity: number;
    terminationCompensation?: number;
    loanDeduction?: number;
    calculationBreakdown: string[];
}

export interface NitaqatInfo {
    status: string;
    color: string;
    saudizationRate: number;
    currentThreshold: number;
    nextStatus?: string;
    nextThreshold?: number;
    progressToNext: number;
    effectiveSaudiCount?: number;
    rawSaudiCount?: number;
}


// Types for Payroll
export interface PayrollRecord {
    employeeId: string;
    employeeName: string;
    basicSalary: number;
    housingAllowance: number;
    transportationAllowance: number;
    otherAllowances: number;
    overtimeHours: number;
    overtimePay: number;
    loanPayoutAmount: number;
    grossEarnings: number;
    gosiDeductionEmployee: number;
    gosiDeductionEmployer: number;
    personalLoanDeduction: number;
    totalDeductions: number;
    netPay: number;
}

export interface PayrollRun {
    month: number;
    year: number;
    records: PayrollRecord[];
    runDate: Date;
}

// Types for Vehicle Management
export interface VehicleDocument {
    startDate: Date | null;
    endDate: Date | null;
}

export interface Vehicle {
    id: string; // Plate number
    plateNumber: string;
    make: string;
    model: string;
    year: number;
    driverId?: string; // Employee ID of the driver
    insurance: VehicleDocument;
    inspection: VehicleDocument; // Fahas
    registration: VehicleDocument; // Istamara
}

export type Driver = Employee;

// Types for Governmental Documents
export interface GovernmentalDocument {
  id: string;
  documentType: string;
  documentName: string;
  documentNumber: string;
  issuingAuthority: string;
  issueDate: Date | null;
  expiryDate: Date | null;
  costToRenew: number;
  renewalFrequency: string;
  notes?: string;
}


// Prop Types for Components
export interface EmployeeTableProps {
  employees: Employee[];
  onUpdateEmployee: (employee: Employee) => void;
  onAddEmployee: (employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onDeleteEmployee: (employeeId: string) => void;
  initialFilter?: { type: string } | null;
  onFilterApplied: () => void;
}

export interface EmployeeDetailModalProps {
    employee: Employee;
    onClose: () => void;
    onUpdateEmployee: (employee: Employee) => void;
    onDeleteEmployee: (employeeId: string) => void;
}

export interface AddEmployeeModalProps {
    onClose: () => void;
    onAddEmployee: (employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export interface VehicleManagementProps {
    vehicles: Vehicle[];
    drivers: Driver[];
    onAddVehicle: (vehicle: Omit<Vehicle, 'id'>) => void;
    onUpdateVehicle: (vehicle: Vehicle) => void;
    onDeleteVehicle: (vehicleId: string) => void;
}

export interface VehicleDetailModalProps {
    vehicle: Vehicle;
    drivers: Driver[];
    onClose: () => void;
    onUpdateVehicle: (vehicle: Vehicle) => void;
    onDeleteVehicle: (vehicleId: string) => void;
}

export interface AddVehicleModalProps {
    drivers: Driver[];
    onClose: () => void;
    onAddVehicle: (vehicle: Omit<Vehicle, 'id'>) => void;
}

export interface GovDocsManagementProps {
    govDocs: GovernmentalDocument[];
    onAddGovDoc: (doc: Omit<GovernmentalDocument, 'id'>) => void;
    onUpdateGovDoc: (doc: GovernmentalDocument) => void;
    onDeleteGovDoc: (docId: string) => void;
}

export interface GovDocDetailModalProps {
    doc: GovernmentalDocument;
    onClose: () => void;
    onUpdateGovDoc: (doc: GovernmentalDocument) => void;
    onDeleteGovDoc: (docId: string) => void;
}

export interface AddGovDocModalProps {
    onClose: () => void;
    onAddGovDoc: (doc: Omit<GovernmentalDocument, 'id'>) => void;
}