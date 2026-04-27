import { isNil, isObject } from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

import { CopyButton } from '@/components/custom/clipboard/copy-button';
import { stringUtils } from '@/lib/string-utils';

import { FieldTypeIcon } from './field-type-icon';

const formatKey = stringUtils.titleCase;

function truncateValue(value: unknown): string {
  if (isNil(value) || value === '') return '';
  if (Array.isArray(value)) return `${value.length} ${t('items')}`;
  if (isObject(value)) {
    const entries = Object.entries(value);
    const preview = entries
      .slice(0, 2)
      .map(([k, v]) => {
        const vs = isNil(v) || typeof v === 'object' ? '…' : String(v);
        return `${k}: ${vs}`;
      })
      .join(', ');
    return preview || `${entries.length} ${t('fields')}`;
  }
  const str = String(value);
  return str.length > 50 ? str.slice(0, 50) + '...' : str;
}

function valueAsCopyText(value: unknown): string {
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value, null, 2);
  }
  return String(value ?? '');
}

function InlineCopyButton({ value }: { value: unknown }) {
  return (
    <CopyButton
      textToCopy={valueAsCopyText(value)}
      variant="ghost"
      withoutTooltip
      className="opacity-0 group-hover:opacity-100 shrink-0 h-6 w-6 p-0"
      onClick={(e) => e.stopPropagation()}
    />
  );
}

function ValueRow({ label, value, depth }: ValueRowProps) {
  const [expanded, setExpanded] = useState(false);
  const paddingLeft = 16 + depth * 24;

  const isNestedObject = isObject(value);

  if (isNestedObject) {
    const nestedEntries = Object.entries(value);
    return (
      <div>
        <div
          onClick={() => setExpanded(!expanded)}
          className="group flex items-center gap-3 py-1.5 hover:bg-accent/50 cursor-pointer"
          style={{ paddingLeft, paddingRight: 16 }}
        >
          <div className="shrink-0 w-4 h-4 flex items-center justify-center text-muted-foreground">
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </div>
          <FieldTypeIcon value={value} />
          <span className="text-sm text-muted-foreground min-w-[100px] max-w-[160px] shrink-0 truncate">
            {label}
          </span>
          <span
            className="text-sm text-foreground/50 truncate flex-1 min-w-0"
            title={JSON.stringify(value)}
          >
            {truncateValue(value)}
          </span>
          <InlineCopyButton value={value} />
        </div>
        {expanded && (
          <div>
            {nestedEntries.map(([key, childValue]) => (
              <ValueRow
                key={key}
                label={formatKey(key)}
                value={childValue}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="group flex items-center gap-3 py-1.5 hover:bg-accent/50"
      style={{ paddingLeft: paddingLeft + 24, paddingRight: 16 }}
    >
      <FieldTypeIcon value={value} />
      <span className="text-sm text-muted-foreground min-w-[100px] max-w-[160px] shrink-0 truncate">
        {label}
      </span>
      <span
        className="text-sm text-foreground/70 truncate flex-1 min-w-0"
        title={
          isNil(value) || value === ''
            ? undefined
            : typeof value === 'object'
            ? JSON.stringify(value)
            : String(value)
        }
      >
        {isNil(value) || value === '' ? (
          <span className="text-muted-foreground/40 italic">{t('empty')}</span>
        ) : Array.isArray(value) ? (
          `${value.length} ${t('items')}`
        ) : (
          String(value)
        )}
      </span>
      <InlineCopyButton value={value} />
    </div>
  );
}

export { ValueRow, InlineCopyButton, formatKey, truncateValue };

type ValueRowProps = {
  label: string;
  value: unknown;
  depth: number;
};
