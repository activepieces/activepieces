import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

const CHAR_DELAY = 0.03;

export function TypewriterText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const [prevText, setPrevText] = useState(text);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (text !== prevText) {
      setIsAnimating(true);
      setPrevText(text);
    }
  }, [text, prevText]);

  if (!isAnimating) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {text.split('').map((char, i) => (
        <motion.span
          key={`${text}-${i}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.1, delay: i * CHAR_DELAY }}
          onAnimationComplete={
            i === text.length - 1
              ? () => setIsAnimating(false)
              : undefined
          }
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
}
