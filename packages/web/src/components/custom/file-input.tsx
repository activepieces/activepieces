import { Attachment01Icon } from '@hugeicons/core-free-icons';
import { t } from 'i18next';
import * as React from 'react';

import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { inputClass } from '@/components/ui/input';
import { cn } from '@/lib/utils';

function FileInput({
  className,
  defaultFileName,
  ref,
  onChange,
  id,
  disabled,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  'aria-label': ariaLabel,
  ...props
}: FileInputProps) {
  const [fileName, setFileName] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useImperativeHandle(ref, () => inputRef.current!);

  const shownName = fileName || defaultFileName || null;

  return (
    <>
      <input
        type="file"
        className="hidden"
        tabIndex={-1}
        aria-hidden
        ref={inputRef}
        disabled={disabled}
        {...props}
        onChange={(event) => {
          const file = event.target.files?.[0];
          setFileName(file ? file.name : null);
          onChange?.(event);
        }}
      />
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
        onClick={() => inputRef.current?.click()}
        className={cn(
          inputClass,
          'flex cursor-pointer items-center gap-2 text-left',
          className,
        )}
      >
        <TextWithTooltip tooltipMessage={shownName ?? ''}>
          <span className={cn('min-w-0 grow', !shownName && 'text-gray-11')}>
            {shownName ?? t('Select a file')}
          </span>
        </TextWithTooltip>
        <HugeiconsIcon
          icon={Attachment01Icon}
          aria-hidden
          className="size-4 shrink-0 text-gray-11"
        />
      </button>
    </>
  );
}

export { FileInput };

type FileInputProps = Omit<React.ComponentProps<'input'>, 'type'> & {
  defaultFileName?: string;
};
