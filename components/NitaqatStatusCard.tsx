import React from 'react';
import { NitaqatInfo } from '../types';
import { t } from '../lib/localization';

interface NitaqatStatusCardProps {
  nitaqatInfo: NitaqatInfo;
  // FIX: Add lang prop to fix type error and enable localization.
  lang: 'en' | 'ar';
}

export const NitaqatStatusCard: React.FC<NitaqatStatusCardProps> = ({ nitaqatInfo, lang }) => {
    const { status, color, saudizationRate, currentThreshold, nextStatus, nextThreshold, progressToNext } = nitaqatInfo;

    return (
        <div className={`bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700`}>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">{t('currentNitaqatStatus', lang)}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">{t('saudizationRate', lang)}</p>
                    <p className="text-5xl font-extrabold text-primary-600 dark:text-primary-400 my-2">{saudizationRate.toFixed(2)}%</p>
                </div>
                <div className="md:col-span-2 space-y-4">
                    <div className="flex justify-between items-baseline">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{t('currentLevel', lang)}</p>
                            <p className={`text-2xl font-bold ${color.replace('bg-', 'text-').replace('-100', '-600')} dark:${color.replace('bg-', 'text-').replace('-100', '-300')}`}>{status}</p>
                        </div>
                         <p className="text-sm text-slate-500 dark:text-slate-400">{t('required', lang)}: <span className="font-semibold">{currentThreshold}%</span></p>
                    </div>

                    <div>
                        <div className="flex justify-between text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                            <span>{t('progressToNextLevel', lang)}</span>
                            {nextStatus ? (
                                <span>{t('next', lang)}: <span className="font-bold">{nextStatus} ({nextThreshold}%)</span></span>
                            ) : (
                                <span className="font-bold text-green-500">{t('highestLevelAchieved', lang)}!</span>
                            )}
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4">
                            <div
                                className="bg-primary-600 h-4 rounded-full transition-all duration-500"
                                style={{ width: `${progressToNext}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};