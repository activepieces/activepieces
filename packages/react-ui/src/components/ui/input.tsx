import { t } from 'i18next';
import { Paperclip } from 'lucide-react';
import * as React from 'react';
import { useImperativeHandle } from 'react';

import { cn } from '@/lib/utils';

import { SelectUtilButton } from '../custom/select-util-button';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  thin?: boolean;
  defaultFileName?: string;
};

export const inputClass =
  'flex h-9 w-full rounded-md border border-input-border bg-background px-3 py-1 text-base shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm';
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, thin = false, defaultFileName, ...props }, ref) => {
    const [fileName, setFileName] = React.useState<string | null>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      setFileName(file ? file.name : null);
      props.onChange?.(event);
    };

    useImperativeHandle(ref, () => inputRef.current!);
    const handleDivClick = () => {
      inputRef.current?.click();
    };

    return type === 'file' ? (
      <>
        <input
          type="file"
          className="hidden"
          ref={inputRef}
          {...props}
          onChange={handleFileChange}
        />
        <div
          onClick={handleDivClick}
          className={cn(inputClass, 'cursor-pointer items-center ', className)}
        >
          <input
            className={cn('grow cursor-pointer outline-hidden bg-transparent', {
              'text-muted-foreground': !fileName,
            })}
            value={fileName || defaultFileName || t('Select a file')}
            readOnly
          />
          <div className="basis-1">
            <SelectUtilButton
              onClick={(e) => e.preventDefault()}
              tooltipText={fileName ? fileName : t('Select a file')}
              Icon={Paperclip}
            ></SelectUtilButton>
          </div>
        </div>
      </>
    ) : (
      <input
        type={type}
        className={cn(inputClass, className, {
          'h-8 p-2': thin,
        })}
        ref={inputRef}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input };
