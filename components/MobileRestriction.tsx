import React from 'react';
import { Monitor } from 'lucide-react';

const MobileRestriction: React.FC = () => {
    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white dark:bg-[#0C0C0C] text-black dark:text-white p-6 text-center">
            <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-900 rounded-full">
                <Monitor size={48} className="text-gray-900 dark:text-gray-100" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight mb-3">
                Desktop Experience Only
            </h1>
            <p className="text-gray-500 dark:text-gray-400 max-w-xs text-sm leading-relaxed tracking-wide">
                This improved workspace is designed for larger screens. Please switch to a desktop or laptop to obtain the best experience.
            </p>

            <div className="mt-12 text-[10px] text-gray-400 tracking-[0.2em] uppercase">
                COMPILE.
            </div>
        </div>
    );
};

export default MobileRestriction;
