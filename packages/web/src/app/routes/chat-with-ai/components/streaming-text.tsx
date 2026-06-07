import { useEffect, useRef, useState } from 'react';

import { Markdown } from '@/components/prompt-kit/markdown';

const CHARS_PER_FRAME = 2;

export function StreamingText({
  text,
  isStreaming,
  className,
}: {
  text: string;
  isStreaming: boolean;
  className?: string;
}) {
  const [revealedLength, setRevealedLength] = useState(
    isStreaming ? 0 : text.length,
  );
  const targetRef = useRef(text);
  const revealedRef = useRef(revealedLength);
  const rafIdRef = useRef<number | null>(null);

  targetRef.current = text;

  useEffect(() => {
    if (!isStreaming) {
      setRevealedLength(text.length);
      revealedRef.current = text.length;
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      return;
    }

    function startLoop() {
      if (rafIdRef.current !== null) return;
      function tick() {
        const target = targetRef.current.length;
        const current = revealedRef.current;
        if (current >= target) {
          rafIdRef.current = null;
          return;
        }
        const next = Math.min(current + CHARS_PER_FRAME, target);
        revealedRef.current = next;
        setRevealedLength(next);
        rafIdRef.current = requestAnimationFrame(tick);
      }
      rafIdRef.current = requestAnimationFrame(tick);
    }
    startLoop();

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [isStreaming, text]);

  const displayText = isStreaming ? text.slice(0, revealedLength) : text;

  return (
    <div className={className}>
      <Markdown>{displayText}</Markdown>
    </div>
  );
}
