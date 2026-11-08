import { useEffect, useRef, useState } from 'react';

export function ChatRenameInput({
  initial,
  label,
  className,
  onDone,
}: {
  initial: string;
  label: string;
  className: string;
  onDone: (title: string | null) => void;
}) {
  const [value, setValue] = useState(initial);
  const ref = useRef<HTMLInputElement>(null);
  const done = useRef(false);
  const finish = (title: string | null) => {
    if (done.current) return;
    done.current = true;
    onDone(title);
  };

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      ref.current?.focus();
      ref.current?.select();
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <input
      ref={ref}
      value={value}
      aria-label={label}
      onChange={(event) => setValue(event.target.value)}
      onPointerDown={(event) => event.stopPropagation()}
      onBlur={() => finish(value)}
      onKeyDown={(event) => {
        if (event.nativeEvent.isComposing) return;
        if (event.key === 'Enter') {
          event.preventDefault();
          finish(value);
        } else if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          finish(null);
        }
      }}
      className={className}
    />
  );
}
