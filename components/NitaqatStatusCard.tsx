import React from 'react';
import { NitaqatInfo } from '../types';

interface NitaqatStatusCardProps {
  nitaqatInfo: NitaqatInfo;
}

export const NitaqatStatusCard: React.FC<NitaqatStatusCardProps> = ({ nitaqatInfo }) => {
    const { status, color, saudizationRate, currentThreshold, nextStatus, nextThreshold, progressToNext } = nitaqatInfo;

    return (
        <div className={`bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700`}>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Current Nitaqat Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Saudization Rate</p>
                    <p className="text-5xl font-extrabold text-indigo-600 dark:text-indigo-400 my-2">{saudizationRate.toFixed(2)}%</p>
                </div>
                <div className="md:col-span-2 space-y-4">
                    <div className="flex justify-between items-baseline">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Current Level</p>
                            <p className={`text-2xl font-bold ${color.replace('bg-', 'text-').replace('-100', '-600')} dark:${color.replace('bg-', 'text-').replace('-100', '-300')}`}>{status}</p>
                        </div>
                         <p className="text-sm text-slate-500 dark:text-slate-400">Required: <span className="font-semibold">{currentThreshold}%</span></p>
                    </div>

                    <div>
                        <div className="flex justify-between text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                            <span>Progress to next level</span>
                            {nextStatus ? (
                                <span>Next: <span className="font-bold">{nextStatus} ({nextThreshold}%)</span></span>
                            ) : (
                                <span className="font-bold text-green-500">Highest Level Achieved!</span>
                            )}
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4">
                            <div
                                className="bg-blue-600 h-4 rounded-full transition-all duration-500"
                                style={{ width: `${progressToNext}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
