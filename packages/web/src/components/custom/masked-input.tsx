import { t } from 'i18next';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input, InputProps } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function MaskedInput({
  className,
  asPassword = false,
  ...props
}: MaskedInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        type={asPassword && !isVisible ? 'password' : 'text'}
        autoComplete="off"
        spellCheck={false}
        className={cn(
          'pr-10',
          !asPassword && !isVisible && '[-webkit-text-security:disc]',
          className,
        )}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="absolute right-1 top-1/2 -translate-y-1/2"
        onClick={() => setIsVisible((visible) => !visible)}
        aria-label={isVisible ? t('Hide value') : t('Show value')}
        aria-pressed={isVisible}
      >
        {isVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </Button>
    </div>
  );
}

export type MaskedInputProps = Omit<
  InputProps,
  'type' | 'autoComplete' | 'spellCheck'
> & {
  asPassword?: boolean;
};
