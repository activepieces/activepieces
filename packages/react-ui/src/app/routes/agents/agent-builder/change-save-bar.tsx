import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface ChangeSaveBarProps {
  isDirty: boolean;
  isPending: boolean;
  onReset: () => void;
  onSubmit: () => void;
}

export const ChangeSaveBar = ({
  isDirty,
  isPending,
  onReset,
  onSubmit,
}: ChangeSaveBarProps) => {
  return (
    <AnimatePresence>
      {isDirty && (
        <motion.div 
          className="fixed bottom-6 left-0 right-0 z-50 flex justify-center"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <motion.div 
            className="flex items-center bg-white border border-gray-200 rounded-full shadow-lg px-8 py-2 gap-6"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              >
                <AlertCircle className="w-5 h-5" />
              </motion.div>
              <span className="font-medium">Unsaved Changes</span>
            </div>
            <Button
              type="button"
              size="sm"
              variant="basic"
              disabled={isPending}
              className="text-foreground"
              onClick={onReset}
            >
              Reset
            </Button>
            <Button
              type="submit"
              size="sm"
              variant="neutral"
              disabled={isPending}
              onClick={onSubmit}
            >
              Save
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};