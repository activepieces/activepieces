import * as React from 'react';

import { Input, InputProps } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type SecretInputProps = Omit<InputProps, 'value' | 'onChange'> & {
  value?: string;
  onChange?: (value: string) => void;
};

const SecretInput = React.forwardRef<HTMLInputElement, SecretInputProps>(
  ({ className, value, onChange, ...restProps }, ref) => {
    const { onBlur, name, disabled, ...otherProps } = restProps;

    const handleNormalInputChange = (
      e: React.ChangeEvent<HTMLInputElement>,
    ) => {
      onChange?.(e.target.value);
    };

    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Input
          ref={ref}
          name={name}
          onBlur={onBlur}
          disabled={disabled}
          className="flex-1"
          value={value || ''}
          onChange={handleNormalInputChange}
          type={otherProps.type}
        />
      </div>
    );
  },
);

SecretInput.displayName = 'SecretInput';

export { SecretInput, type SecretInputProps };
