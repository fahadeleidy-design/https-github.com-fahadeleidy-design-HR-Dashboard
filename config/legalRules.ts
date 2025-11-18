import { RuleDefinition } from '../types';

const legalRules: RuleDefinition[] = [
  {
    id: "SAUDI_LABOR_LAW_EOSB_V1",
    version: "1.0.0",
    type: "EOSB",
    description: "Standard End-of-Service Gratuity calculation based on Saudi Labor Law Article 84 & 85.",
    parameters: {
      termination: {
        firstPeriod: { "years": 5, "ratePerYearMonths": 0.5 },
        subsequentRateMonthsPerYear: 1,
        indefiniteContractNoticeMonths: 2
      },
      resignation: {
        noGratuityYearsLessThan: 2,
        oneThirdGratuityYearsLessThan: 5,
        twoThirdsGratuityYearsLessThan: 10,
        fullGratuityYearsEqualOrGreaterThan: 10
      }
    }
  },
  {
    id: "SAUDI_LABOR_LAW_LEAVE_V1",
    version: "1.0.0",
    type: "LEAVE",
    description: "Annual leave entitlement based on Saudi Labor Law.",
    parameters: {
      annualLeave: {
        baseDays: 21,
        enhancedDays: 30,
        enhancementAfterYears: 5
      }
    }
  },
  {
    id: "SAUDI_GOSI_CONTRIBUTION_V1",
    version: "1.0.0",
    type: "GOSI",
    description: "GOSI (Social Insurance) contributions for private sector employees.",
    parameters: {
      saudi: {
        annuities: {
          employee: 0.09,
          employer: 0.09,
        },
        saned: { // Unemployment insurance
          employee: 0.0075,
          employer: 0.0075,
        },
        occupationalHazards: {
          employee: 0,
          employer: 0.02,
        },
        maxContributoryWage: 45000,
      },
      nonSaudi: {
         occupationalHazards: {
          employee: 0,
          employer: 0.02,
        },
        maxContributoryWage: 45000,
      }
    }
  },
   {
    id: "SAUDI_LABOR_LAW_OVERTIME_V1",
    version: "1.0.0",
    type: "OVERTIME",
    description: "Overtime pay calculation based on Saudi Labor Law Article 107.",
    parameters: {
      multiplier: 1.5, // 100% of basic hourly wage + 50% premium
      workingHoursPerDay: 8,
      workingDaysPerMonth: 22 // Assumed average
    }
  },
  {
    id: "SAUDI_NITAQAT_THRESHOLDS_V1",
    version: "1.0.0",
    type: "NITAQAT",
    description: "Nitaqat program thresholds for Saudization rates.",
    parameters: {
      levels: [
        { name: 'Red', nameAr: 'أحمر', threshold: 0, color: 'bg-red-100 text-red-600' },
        { name: 'Yellow', nameAr: 'أصفر', threshold: 5, color: 'bg-yellow-100 text-yellow-600' },
        { name: 'Low Green', nameAr: 'أخضر منخفض', threshold: 7, color: 'bg-lime-100 text-lime-600' },
        { name: 'Medium Green', nameAr: 'أخضر متوسط', threshold: 15, color: 'bg-green-100 text-green-500' },
        { name: 'High Green', nameAr: 'أخضر مرتفع', threshold: 25, color: 'bg-green-100 text-green-600' },
        { name: 'Platinum', nameAr: 'بلاتيني', threshold: 40, color: 'bg-cyan-100 text-cyan-600' }
      ],
      sectorAdjustments: {
        trading: { 'Yellow': 5, 'Low Green': 7, 'Medium Green': 15, 'High Green': 25, 'Platinum': 40 },
        manufacturing: { 'Yellow': 6, 'Low Green': 8, 'Medium Green': 12, 'High Green': 18, 'Platinum': 30 }
      }
    }
  }
];

export default legalRules;