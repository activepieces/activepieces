import { t } from 'i18next';
import { Paperclip } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

import { SelectUtilButton } from '../custom/select-util-button';

export const inputClass =
  'flex h-9 w-full min-w-0 rounded-md border border-gray-8 bg-transparent px-2.5 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none selection:bg-accent-9 selection:text-on-accent file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-gray-12 placeholder:text-gray-11 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-gray-6/30 focus-visible:border-gray-8 focus-visible:ring-[1px] focus-visible:ring-gray-8/50 aria-invalid:border-danger-9 aria-invalid:ring-danger-9/20 dark:aria-invalid:ring-danger-9/40';

function Input({
  className,
  type,
  thin = false,
  defaultFileName,
  ref,
  ...props
}: InputProps) {
  const [fileName, setFileName] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useImperativeHandle(ref, () => inputRef.current!);

  return type === 'file' ? (
    <>
      <input
        type="file"
        className="hidden"
        ref={inputRef}
        {...props}
        onChange={(event) =>
          handleFileChange(event, setFileName, props.onChange)
        }
      />
      <div
        onClick={() => inputRef.current?.click()}
        className={cn(inputClass, 'cursor-pointer items-center', className)}
      >
        <input
          data-slot="input"
          className={cn('grow cursor-pointer outline-hidden bg-transparent', {
            'text-gray-11': !fileName,
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
      data-slot="input"
      className={cn(inputClass, className, {
        'h-7 p-2': thin,
      })}
      ref={inputRef}
      {...props}
    />
  );
}

// Helper functions

function handleFileChange(
  event: React.ChangeEvent<HTMLInputElement>,
  setFileName: React.Dispatch<React.SetStateAction<string | null>>,
  onChange?: React.ChangeEventHandler<HTMLInputElement>,
) {
  const file = event.target.files?.[0];
  setFileName(file ? file.name : null);
  onChange?.(event);
}

// Type definitions

type InputProps = React.ComponentProps<'input'> & {
  thin?: boolean;
  defaultFileName?: string;
};

export { Input };
export type { InputProps };
