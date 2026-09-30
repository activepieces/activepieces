import { t } from 'i18next';
import { Paperclip } from 'lucide-react';
import * as React from 'react';

import { SelectUtilButton } from '@/components/custom/select-util-button';
import { inputClass } from '@/components/ui/input';
import { cn } from '@/lib/utils';

function FileInput({
  className,
  defaultFileName,
  ref,
  onChange,
  ...props
}: FileInputProps) {
  const [fileName, setFileName] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useImperativeHandle(ref, () => inputRef.current!);

  return (
    <>
      <input
        type="file"
        className="hidden"
        ref={inputRef}
        {...props}
        onChange={(event) => {
          const file = event.target.files?.[0];
          setFileName(file ? file.name : null);
          onChange?.(event);
        }}
      />
      <div
        onClick={() => inputRef.current?.click()}
        className={cn(
          inputClass,
          'flex cursor-pointer items-center',
          className,
        )}
      >
        <input
          data-slot="input"
          className={cn('grow cursor-pointer bg-transparent outline-hidden', {
            'text-gray-11': !fileName,
          })}
          value={fileName || defaultFileName || t('Select a file')}
          readOnly
        />
        <SelectUtilButton
          onClick={(event) => event.preventDefault()}
          tooltipText={fileName ? fileName : t('Select a file')}
          Icon={Paperclip}
        />
      </div>
    </>
  );
}

export { FileInput };

type FileInputProps = Omit<React.ComponentProps<'input'>, 'type'> & {
  defaultFileName?: string;
};
