import { t } from 'i18next';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input, InputProps } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function MaskedInput({ className, ...props }: MaskedInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        type="text"
        autoComplete="off"
        spellCheck={false}
        className={cn(
          'pr-10',
          !isVisible && '[-webkit-text-security:disc]',
          className,
        )}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
        onClick={() => setIsVisible((visible) => !visible)}
        aria-label={isVisible ? t('Hide value') : t('Show value')}
      >
        {isVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </Button>
    </div>
  );
}

export type MaskedInputProps = Omit<
  InputProps,
  'type' | 'autoComplete' | 'spellCheck'
>;
