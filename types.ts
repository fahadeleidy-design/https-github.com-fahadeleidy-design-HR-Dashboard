
export interface Employee {
  employeeId: string;
  employeeNameArabic: string;
  employeeNameEnglish: string;
  nationality: string;
  department: string;
  jobTitle: string;
  status: string;
  dateOfJoining: Date | null;
  iqamaNumber: string;
  iqamaIssueDate: Date | null;
  iqamaExpiryDate: Date | null;
  passportNumber: string;
  passportIssueDate: Date | null;
  passportExpiryDate: Date | null;
  contractType: string;
  contractStartDate: Date | null;
  contractEndDate: Date | null;
  email: string;
  mobileNumber: string;
  sponsorName: string;
  basicSalary?: number;
}

// Type for chart data points
export interface ChartDataPoint {
  name: string;
  value: number;
}