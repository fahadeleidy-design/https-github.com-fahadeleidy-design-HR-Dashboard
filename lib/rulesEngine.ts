import { Employee, RuleDefinition, TerminationReason, EOSBResult, NitaqatInfo } from '../types';
import legalRules from '../config/legalRules';

// In a real app, this might fetch from a server. For now, we import directly.
export const loadRules = (): RuleDefinition[] => {
  return legalRules;
};

export const calculateGOSI = (employee: Employee, rule: RuleDefinition): { employee: number, employer: number } => {
    if (!employee.payroll.basicSalary) return { employee: 0, employer: 0 };
    
    const contributoryWage = Math.min(
        (employee.payroll.basicSalary || 0) + (employee.payroll.housingAllowance || 0),
        rule.parameters.saudi.maxContributoryWage
    );

    if (contributoryWage <= 0) return { employee: 0, employer: 0 };

    let employeeTotalPercent = 0;
    let employerTotalPercent = 0;

    if (employee.isSaudi) {
        const params = rule.parameters.saudi;
        employeeTotalPercent = params.annuities.employee + params.saned.employee;
        employerTotalPercent = params.annuities.employer + params.saned.employer + params.occupationalHazards.employer;
    } else {
        const params = rule.parameters.nonSaudi;
        employeeTotalPercent = params.occupationalHazards.employee; // Usually 0
        employerTotalPercent = params.occupationalHazards.employer;
    }

    return {
        employee: contributoryWage * employeeTotalPercent,
        employer: contributoryWage * employerTotalPercent
    };
};

// FIX: Update function signature to accept an employee array instead of counts to fix type mismatch.
export const calculateNitaqatStatus = (employees: (Employee | Partial<Employee>)[], rule: RuleDefinition, sector: string, lang: 'en' | 'ar'): NitaqatInfo => {
    const totalCount = employees.length;
    const rawSaudiCount = employees.filter(e => e.isSaudi).length;
    
    // In a real system, effectiveSaudiCount would be calculated based on special rules (e.g. weighting).
    // For this simulation, we'll assume the effective count is the same as the raw count.
    const effectiveSaudiCount = rawSaudiCount;

    const rate = totalCount > 0 ? (effectiveSaudiCount / totalCount) * 100 : 0;
    
    const validSectors = Object.keys(rule.parameters.sectorAdjustments);
    const selectedSectorKey = validSectors.includes(sector) ? sector : validSectors[0];
    const sectorThresholds = rule.parameters.sectorAdjustments[selectedSectorKey];
    
    const sortedLevels = [...rule.parameters.levels].sort((a, b) => b.threshold - a.threshold);
    
    let currentLevel = sortedLevels[sortedLevels.length - 1]; 
    for(const level of sortedLevels) {
        const threshold = sectorThresholds[level.name.toLowerCase().replace(' ', '')] ?? level.threshold;
        if (rate >= threshold) {
            currentLevel = {...level, threshold };
            break;
        }
    }
    
    const currentLevelIndex = sortedLevels.findIndex(l => l.name === currentLevel.name);
    let nextLevel = null;
    if (currentLevelIndex > 0) {
        const next = sortedLevels[currentLevelIndex - 1];
        const nextThresholdValue = sectorThresholds[next.name.toLowerCase().replace(' ', '')] ?? next.threshold;
        nextLevel = {...next, threshold: nextThresholdValue};
    }

    const progress = nextLevel && nextLevel.threshold > currentLevel.threshold
        ? Math.max(0, Math.min(100, ((rate - currentLevel.threshold) / (nextLevel.threshold - currentLevel.threshold)) * 100))
        : (rate >= currentLevel.threshold ? 100 : 0);

    const getName = (level: any) => lang === 'ar' ? level.nameAr : level.name;

    return {
        status: getName(currentLevel),
        color: currentLevel.color,
        saudizationRate: rate,
        currentThreshold: currentLevel.threshold,
        nextStatus: nextLevel ? getName(nextLevel) : undefined,
        nextThreshold: nextLevel?.threshold,
        progressToNext: isNaN(progress) ? 0 : progress,
        rawSaudiCount: rawSaudiCount,
        effectiveSaudiCount: effectiveSaudiCount,
    };
};


export const calculateEOSB = (
    employee: Employee, 
    rule: RuleDefinition, 
    reason: TerminationReason, 
    salary: number,
    terminationCompensationMonths: number
): EOSBResult | null => {
    if (!employee.dateOfJoining || salary <= 0) return null;

    const today = employee.dateOfExit ? new Date(employee.dateOfExit) : new Date();
    const joinDate = new Date(employee.dateOfJoining);
    const yearsOfService = (today.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

    const params = rule.parameters;
    const breakdown: string[] = [];
    let gratuity = 0;
    let terminationCompensation = 0;
    let loanDeduction = 0;

    // Step 1: Calculate base gratuity
    const termParams = params.termination;
    if (yearsOfService <= termParams.firstPeriod.years) {
        gratuity = yearsOfService * (salary * termParams.firstPeriod.ratePerYearMonths);
        breakdown.push(`First ${termParams.firstPeriod.years} years: ${yearsOfService.toFixed(2)} years * ${termParams.firstPeriod.ratePerYearMonths} months' salary = SAR ${gratuity.toFixed(2)}`);
    } else {
        const firstPeriodGratuity = termParams.firstPeriod.years * (salary * termParams.firstPeriod.ratePerYearMonths);
        const subsequentYears = yearsOfService - termParams.firstPeriod.years;
        const subsequentGratuity = subsequentYears * (salary * termParams.subsequentRateMonthsPerYear);
        gratuity = firstPeriodGratuity + subsequentGratuity;
        breakdown.push(`First ${termParams.firstPeriod.years} years gratuity = SAR ${firstPeriodGratuity.toFixed(2)}`);
        breakdown.push(`Subsequent years: ${subsequentYears.toFixed(2)} years * ${termParams.subsequentRateMonthsPerYear} month's salary = SAR ${subsequentGratuity.toFixed(2)}`);
    }
    breakdown.push(`Total base gratuity: SAR ${gratuity.toFixed(2)}`);

    // Step 2: Apply reason-specific logic and update breakdown
    if (reason === 'resignation') {
        const resigParams = params.resignation;
        let multiplier = 1;
        let reasonStr = "Resignation after 10+ years: Full gratuity is awarded.";

        if (yearsOfService < resigParams.noGratuityYearsLessThan) {
            multiplier = 0;
            reasonStr = `Resignation with < ${resigParams.noGratuityYearsLessThan} years of service: No gratuity is due.`;
        } else if (yearsOfService < resigParams.oneThirdGratuityYearsLessThan) {
            multiplier = 1 / 3;
            reasonStr = `Resignation with 2-5 years of service: 1/3 of gratuity is awarded.`;
        } else if (yearsOfService < resigParams.twoThirdsGratuityYearsLessThan) {
            multiplier = 2 / 3;
            reasonStr = `Resignation with 5-10 years of service: 2/3 of gratuity is awarded.`;
        }
        
        breakdown.push(reasonStr);
        if (multiplier !== 1) {
            gratuity *= multiplier;
            breakdown.push(`Adjusted gratuity: SAR ${gratuity.toFixed(2)}`);
        }
    } else if (reason === 'termination') {
        breakdown.push("Reason: Contract Termination by Employer. Full gratuity is awarded.");
        
        if (terminationCompensationMonths > 0) {
            terminationCompensation = terminationCompensationMonths * salary;
            breakdown.push(`+ Additional Compensation (${terminationCompensationMonths} months) = SAR ${terminationCompensation.toFixed(2)}`);
        }

    } else if (reason === 'non-renewal') {
        breakdown.push("Reason: Contract Completion / Non-Renewal. Full gratuity is awarded.");
    }
    
    // Step 3: Calculate outstanding loan
    const loanInfo = employee.payroll.loanInfo;
    if (loanInfo && loanInfo.totalAmount && loanInfo.startDate) {
        const loanStartDate = new Date(loanInfo.startDate);
        const installments = loanInfo.installments || 4;
        const monthlyInstallment = loanInfo.totalAmount / installments;

        if (today > loanStartDate) {
            let monthsPassed = (today.getFullYear() - loanStartDate.getFullYear()) * 12;
            monthsPassed -= loanStartDate.getMonth();
            monthsPassed += today.getMonth();
            
            const paidInstallments = Math.max(0, Math.min(monthsPassed, installments));
            const totalPaid = paidInstallments * monthlyInstallment;
            const outstandingLoan = loanInfo.totalAmount - totalPaid;

            if (outstandingLoan > 0.01) { // Use a small threshold for floating point inaccuracies
                loanDeduction = outstandingLoan;
                breakdown.push(`- Outstanding Loan Deduction: SAR ${loanDeduction.toFixed(2)} (${installments - paidInstallments} of ${installments} installments remaining).`);
            }
        }
    }

    return {
        yearsOfService,
        totalGratuity: gratuity,
        terminationCompensation,
        loanDeduction,
        calculationBreakdown: breakdown,
    };
};
