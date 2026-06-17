import { isNil, isObject } from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

import { stringUtils } from '@/lib/string-utils';

import { FieldTypeIcon } from './field-type-icon';

const formatKey = stringUtils.titleCase;
const MAX_NESTED_DEPTH = 10;

function truncateValue(value: unknown): string {
  if (isNil(value) || value === '') return '';
  if (Array.isArray(value)) return t('itemCount', { count: value.length });
  if (isObject(value)) {
    const entries = Object.entries(value);
    const preview = entries
      .slice(0, 2)
      .map(([k, v]) => {
        const vs = isNil(v) || typeof v === 'object' ? '…' : String(v);
        return `${k}: ${vs}`;
      })
      .join(', ');
    return preview || t('fieldCount', { count: entries.length });
  }
  return String(value);
}

function ValueRow({ label, value, depth }: ValueRowProps) {
  const [expanded, setExpanded] = useState(false);
  const paddingLeft = 16 + depth * 24;

  if (isObject(value) || (Array.isArray(value) && value.length > 0)) {
    if (depth >= MAX_NESTED_DEPTH) {
      return (
        <div
          className="py-1.5 text-xs text-muted-foreground italic"
          style={{ paddingLeft, paddingRight: 16 }}
        >
          {label}: {t('Too deep to display')}
        </div>
      );
    }

    const nestedEntries: Array<readonly [string, unknown]> = Array.isArray(
      value,
    )
      ? value.map((item, idx) => [`${t('Item')} ${idx + 1}`, item] as const)
      : Object.entries(value);

    return (
      <div>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-3 py-1.5 hover:bg-accent/50 cursor-pointer w-full text-left"
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
        </button>
        {expanded && (
          <div>
            {nestedEntries.map(([key, childValue]) => (
              <ValueRow
                key={key}
                label={Array.isArray(value) ? key : formatKey(key)}
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
      className="flex items-start gap-3 py-1.5 hover:bg-accent/50"
      style={{ paddingLeft: paddingLeft + 24, paddingRight: 16 }}
    >
      <span className="flex h-5 items-center shrink-0">
        <FieldTypeIcon value={value} />
      </span>
      <span className="text-sm text-muted-foreground min-w-[100px] max-w-[160px] shrink-0 truncate">
        {label}
      </span>
      <span className="text-sm text-foreground/70 flex-1 min-w-0 break-words whitespace-pre-wrap">
        {isNil(value) || value === '' ? (
          <span className="text-muted-foreground/40 italic">{t('empty')}</span>
        ) : Array.isArray(value) ? (
          t('itemCount', { count: value.length })
        ) : (
          String(value)
        )}
      </span>
    </div>
  );
}

export { ValueRow, formatKey, truncateValue };

type ValueRowProps = {
  label: string;
  value: unknown;
  depth: number;
};
