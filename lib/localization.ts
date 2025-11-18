// lib/localization.ts

const translations = {
  en: {
    selectIndustrySector: "Select Industry Sector:",
    currentNitaqatStatus: "Current Nitaqat Status",
    saudizationRate: "Saudization Rate",
    currentLevel: "Current Level",
    required: "Required",
    progressToNextLevel: "Progress to next level",
    next: "Next",
    highestLevelAchieved: "Highest Level Achieved!",
    saudizationSimulator: "Saudization Simulator",
  },
  ar: {
    selectIndustrySector: "اختر قطاع الصناعة:",
    currentNitaqatStatus: "حالة النطاقات الحالية",
    saudizationRate: "نسبة التوطين",
    currentLevel: "المستوى الحالي",
    required: "مطلوب",
    progressToNextLevel: "التقدم إلى المستوى التالي",
    next: "التالي",
    highestLevelAchieved: "تم تحقيق أعلى مستوى!",
    saudizationSimulator: "محاكي التوطين",
  },
};

export const t = (key: keyof typeof translations.en, lang: 'en' | 'ar'): string => {
  return translations[lang][key] || translations['en'][key];
};
