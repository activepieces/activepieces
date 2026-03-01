import { MinusIcon, PlusIcon } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface NumberInputWithButtonsProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
}

const NumberInputWithButtons: React.FC<NumberInputWithButtonsProps> = ({
  value,
  onChange,
  min = 0,
  max = Infinity,
  step = 1,
  disabled = false,
  className = '',
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value) || 0;
    onChange(Math.min(Math.max(newValue, min), max));
  };

  const increment = () => {
    if (disabled) return;
    onChange(Math.min(value + step, max));
  };

  const decrement = () => {
    if (disabled) return;
    onChange(Math.max(value - step, min));
  };

  return (
    <div className={`flex items-center ${className}`}>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 rounded-r-none"
        onClick={decrement}
        disabled={disabled || value <= min}
        type="button"
      >
        <MinusIcon className="h-3.5 w-3.5" />
      </Button>
      <Input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={handleChange}
        className="h-8 w-16 text-center rounded-none border-x-0"
        disabled={disabled}
      />
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 rounded-l-none"
        onClick={increment}
        disabled={disabled || value >= max}
        type="button"
      >
        <PlusIcon className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
};

export default NumberInputWithButtons;
