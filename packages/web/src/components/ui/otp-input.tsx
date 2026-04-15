import { useRef, useState } from 'react';

import { cn } from '@/lib/utils';

const OtpInput: React.FC<OtpInputProps> = ({
  onChange,
  disabled = false,
  autoFocus = false,
}) => {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const notify = (updatedDigits: string[]) => {
    const value = updatedDigits.join('');
    if (value.length === 6) {
      onChange({ value });
    }
  };

  const handleChange = (index: number, char: string) => {
    const digit = char.replace(/\D/g, '').slice(-1);
    const updated = digits.slice();
    updated[index] = digit;
    setDigits(updated);
    if (digit && index < 5) {
      refs.current[index + 1]?.focus();
    }
    notify(updated);
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        const updated = digits.slice();
        updated[index] = '';
        setDigits(updated);
      } else if (index > 0) {
        const updated = digits.slice();
        updated[index - 1] = '';
        setDigits(updated);
        refs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 6);
    if (!pasted) return;
    const updated = Array(6).fill('');
    for (let i = 0; i < pasted.length; i++) {
      updated[i] = pasted[i];
    }
    setDigits(updated);
    const nextEmpty = updated.findIndex((d, i) => i >= pasted.length && !d);
    const focusIndex = nextEmpty === -1 ? 5 : nextEmpty;
    refs.current[focusIndex]?.focus();
    notify(updated);
  };

  return (
    <div className="flex gap-2">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            refs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          disabled={disabled}
          autoFocus={autoFocus && index === 0}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className={cn(
            'h-12 w-10 rounded-md border border-input bg-background text-center text-lg font-semibold shadow-sm',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
        />
      ))}
    </div>
  );
};

OtpInput.displayName = 'OtpInput';

export { OtpInput };

type OtpInputProps = {
  onChange: (v: { value: string }) => void;
  disabled?: boolean;
  autoFocus?: boolean;
};
