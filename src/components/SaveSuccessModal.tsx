import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Trash2, Info, AlertTriangle } from 'lucide-react';

export type NotificationType = 'success' | 'delete' | 'info' | 'warning';

export interface SaveNotificationData {
  isOpen: boolean;
  type?: NotificationType;
  title?: string;
  message?: string;
}

interface SaveSuccessModalProps {
  isOpen: boolean;
  type?: NotificationType;
  title?: string;
  message?: string;
  onClose: () => void;
  autoCloseDuration?: number; // ms, default 2500
}

export const SaveSuccessModal: React.FC<SaveSuccessModalProps> = ({
  isOpen,
  type = 'success',
  title,
  message,
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

  const defaultTitle =
    title ||
    (type === 'delete'
      ? 'Berhasil Dihapus!'
      : type === 'warning'
      ? 'Peringatan'
      : type === 'info'
      ? 'Informasi'
      : 'Berhasil Disimpan!');

  const defaultMessage =
    message ||
    (type === 'delete'
      ? 'Data berhasil dihapus dari sistem.'
      : 'Data berhasil tersimpan ke Firebase!');

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 cursor-pointer"
          onClick={onClose}
        >
          {/* Backdrop with subtle blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Card matching the user's reference specification */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            onClick={(e) => {
              // Click inside also triggers dismissal per user instruction:
              // "dapat ditutup instan dengan mengetuk/mengklik di area layar mana pun."
              onClose();
            }}
            className="relative z-10 w-full max-w-sm sm:max-w-md bg-white dark:bg-[#111827] rounded-3xl p-7 sm:p-9 shadow-2xl border border-slate-100 dark:border-slate-800 text-center flex flex-col items-center justify-center select-none"
          >
            {/* Circular Badge with Checkmark / Trash Icon */}
            {type === 'delete' ? (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-3 sm:border-4 border-[#fca5a5]/80 dark:border-rose-500/30 bg-[#fef2f2] dark:bg-rose-950/40 flex items-center justify-center mb-5 shadow-inner">
                <Trash2 className="w-10 h-10 sm:w-12 sm:h-12 text-[#ef4444] dark:text-rose-400 stroke-[2.5]" />
              </div>
            ) : type === 'warning' ? (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-3 sm:border-4 border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center mb-5 shadow-inner">
                <AlertTriangle className="w-10 h-10 sm:w-12 sm:h-12 text-amber-500 stroke-[2.5]" />
              </div>
            ) : type === 'info' ? (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-3 sm:border-4 border-blue-300 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center mb-5 shadow-inner">
                <Info className="w-10 h-10 sm:w-12 sm:h-12 text-blue-500 stroke-[2.5]" />
              </div>
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-3 sm:border-4 border-[#86efac]/80 dark:border-emerald-500/30 bg-[#f0fdf4] dark:bg-emerald-950/40 flex items-center justify-center mb-5 shadow-inner">
                <Check className="w-10 h-10 sm:w-12 sm:h-12 text-[#22c55e] dark:text-emerald-400 stroke-[3]" />
              </div>
            )}

            {/* Title */}
            <h3 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight mb-2">
              {defaultTitle}
            </h3>

            {/* Subtitle Message */}
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed max-w-xs sm:max-w-sm">
              {defaultMessage}
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
