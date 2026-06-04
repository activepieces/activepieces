import { AnimatePresence, motion } from 'motion/react';

export function TypewriterText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={text}
        className={className}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        {text}
      </motion.span>
    </AnimatePresence>
  );
}
