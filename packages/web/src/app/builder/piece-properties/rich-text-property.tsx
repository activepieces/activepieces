import { RichTextProperty as RichTextPropertySchema } from '@activepieces/pieces-framework';
import { t } from 'i18next';
import React, { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';

import { ReadMoreDescription } from '@/components/custom/read-more-description';
import { FormItem, FormLabel } from '@/components/ui/form';
import { inputClass } from '@/components/ui/input';
import { RequiredFieldAsterisk } from '@/components/ui/label';
import { cn } from '@/lib/utils';

import { TextInputWithMentions } from './text-input-with-mentions';

function resolveMode(value: unknown): RichTextMode {
  if (typeof value !== 'string') {
    return 'plain';
  }
  const normalized = value.toLowerCase();
  if (normalized === 'html') {
    return 'html';
  }
  if (normalized === 'markdown' || normalized === 'md') {
    return 'markdown';
  }
  return 'plain';
}

function countCharacters(value: unknown, mode: RichTextMode): number {
  if (typeof value !== 'string') {
    return 0;
  }
  if (mode === 'html') {
    const parsed = new DOMParser().parseFromString(value, 'text/html');
    return parsed.body.textContent?.length ?? 0;
  }
  return value.length;
}

const editorClass = cn(
  inputClass,
  'h-[unset] block min-h-20 max-h-72 overflow-y-auto py-2',
);

function RichTextProperty({
  property,
  inputName,
  value,
  onChange,
  disabled,
}: RichTextPropertyProps) {
  const form = useFormContext();

  const formatInputName = useMemo(() => {
    if (!property.formatProperty) {
      return undefined;
    }
    const lastDotIndex = inputName.lastIndexOf('.');
    const prefix =
      lastDotIndex >= 0 ? inputName.slice(0, lastDotIndex + 1) : '';
    return `${prefix}${property.formatProperty}`;
  }, [inputName, property.formatProperty]);

  const watchedFormat = form.watch(
    formatInputName ?? '__rich_text_no_format__',
  );
  const mode = formatInputName ? resolveMode(watchedFormat) : 'plain';
  const charCount = countCharacters(value, mode);

  return (
    <FormItem className="flex flex-col">
      <FormLabel className="flex items-center gap-1 h-7.5 max-h-7.5">
        <div className="pt-1 flex items-center gap-1">
          <span>{property.displayName}</span>
          {property.required && <RequiredFieldAsterisk />}
        </div>
        <span className="grow" />
        <span className="text-xs text-muted-foreground tabular-nums">
          {t('{count, plural, other {# chars}}', { count: charCount })}
        </span>
      </FormLabel>

      <TextInputWithMentions
        key={mode}
        disabled={disabled}
        initialValue={value ?? ''}
        onChange={onChange}
        outputFormat={mode === 'html' ? 'html' : 'text'}
        className={editorClass}
      />

      {property.description && (
        <ReadMoreDescription text={property.description} />
      )}
    </FormItem>
  );
}

RichTextProperty.displayName = 'RichTextProperty';

export { RichTextProperty };

type RichTextMode = 'plain' | 'html' | 'markdown';

type RichTextPropertyProps = {
  property: RichTextPropertySchema<boolean>;
  inputName: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
};
