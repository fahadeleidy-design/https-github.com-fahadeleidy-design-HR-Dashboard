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
  createdAt?: string;
  updatedAt?: string;
}

export type Tab = 'dashboard' | 'directory' | 'saudization' | 'payroll' | 'eosb' | 'leave' | 'reports' | 'ask-ai' | 'loans';

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