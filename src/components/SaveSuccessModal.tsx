import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check } from 'lucide-react';

export interface SaveNotificationData {
  isOpen: boolean;
  title?: string;
  message?: string;
}

interface SaveSuccessModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  onClose: () => void;
  autoCloseDuration?: number; // ms, default 2500
}

export const SaveSuccessModal: React.FC<SaveSuccessModalProps> = ({
  isOpen,
  title = 'Berhasil Disimpan!',
  message = 'Data berhasil tersimpan ke Firebase!',
  onClose,
  autoCloseDuration = 2500,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      onClose();
    }, autoCloseDuration);

    return () => clearTimeout(timer);
  }, [isOpen, autoCloseDuration, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Backdrop with subtle blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
          />

          {/* Modal Card matching the user's reference image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-sm sm:max-w-md bg-white dark:bg-[#111827] rounded-3xl p-7 sm:p-9 shadow-2xl border border-slate-100 dark:border-slate-800 text-center flex flex-col items-center justify-center cursor-pointer"
          >
            {/* Green Circular Badge with Checkmark */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-3 sm:border-4 border-[#86efac]/80 dark:border-emerald-500/30 bg-[#f0fdf4] dark:bg-emerald-950/40 flex items-center justify-center mb-5 shadow-inner">
              <Check
                className="w-10 h-10 sm:w-12 sm:h-12 text-[#22c55e] dark:text-emerald-400 stroke-[3]"
              />
            </div>

            {/* Title */}
            <h3 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight mb-2">
              {title}
            </h3>

            {/* Subtitle Message */}
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed max-w-xs sm:max-w-sm">
              {message}
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
