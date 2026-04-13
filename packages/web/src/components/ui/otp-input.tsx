import { useRef } from 'react';

import { cn } from '@/lib/utils';

const OTP_LENGTH = 6;

function OtpInput({
  onChange,
  disabled = false,
  autoFocus = false,
}: OtpInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const handleChange = (index: number, value: string) => {
    const singleChar = value.slice(-1);
    if (singleChar && !/^\d$/.test(singleChar)) {
      return;
    }

    const inputs = inputRefs.current;
    if (inputs[index]) {
      inputs[index]!.value = singleChar;
    }

    if (singleChar && index < OTP_LENGTH - 1) {
      inputs[index + 1]?.focus();
    }

    fireOnChange();
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === 'Backspace') {
      const inputs = inputRefs.current;
      if (inputs[index]?.value) {
        inputs[index]!.value = '';
        fireOnChange();
      } else if (index > 0) {
        inputs[index - 1]?.focus();
        inputs[index - 1]!.value = '';
        fireOnChange();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, OTP_LENGTH);
    const inputs = inputRefs.current;
    pasted.split('').forEach((char, i) => {
      if (inputs[i]) {
        inputs[i]!.value = char;
      }
    });
    const nextIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputs[nextIndex]?.focus();
    fireOnChange();
  };

  const fireOnChange = () => {
    const value = inputRefs.current.map((el) => el?.value ?? '').join('');
    if (value.length === OTP_LENGTH) {
      onChange({ value });
    }
  };

  return (
    <div className="flex gap-2">
      {Array.from({ length: OTP_LENGTH }).map((_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          disabled={disabled}
          autoFocus={autoFocus && index === 0}
          className={cn(
            'h-12 w-10 rounded-md border border-input bg-background text-center text-lg font-semibold shadow-xs transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
        />
      ))}
    </div>
  );
}

OtpInput.displayName = 'OtpInput';

export { OtpInput };

interface OtpInputProps {
  onChange: ({ value }: { value: string }) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}
