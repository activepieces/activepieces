import { isNil, isObject } from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { formatUtils } from '@/lib/format-utils';
import { pathUtils } from '@/lib/path-utils';
import { cn } from '@/lib/utils';

import { hintUtils } from './resolve-hints';
import { HintField, FieldFormat } from './types';

const MAX_TEXT_LENGTH = 200;
const SAFE_URL_PROTOCOLS = new Set(['http:', 'https:']);
const DEFAULT_CURRENCY = 'USD';

function getValueByDotPath(obj: unknown, path: string): unknown {
  return pathUtils.getValueByDotPath(obj, path);
}

function resolveValue(json: unknown, field: HintField): unknown {
  const path = field.value ?? field.key;
  return getValueByDotPath(json, path);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function isSafeUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return SAFE_URL_PROTOCOLS.has(parsed.protocol);
  } catch {
    return false;
  }
}

function isSafeEmail(value: string): boolean {
  return !/[\r\n]/.test(value);
}

function toFiniteNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function FormatSingleValue({
  value,
  format,
}: {
  value: unknown;
  format: FieldFormat | undefined;
}) {
  if (isNil(value) || value === '') {
    return <span className="text-muted-foreground italic">{t('empty')}</span>;
  }

  const stringValue = String(value);

  if (format === 'email') {
    if (!isSafeEmail(stringValue)) {
      return <span className="break-all">{stringValue}</span>;
    }
    return (
      <a
        href={`mailto:${encodeURIComponent(stringValue)}`}
        className="text-primary underline-offset-4 hover:underline"
        title={stringValue}
      >
        {stringValue}
      </a>
    );
  }

  if (format === 'url') {
    if (!isSafeUrl(stringValue)) {
      return <span className="break-all">{stringValue}</span>;
    }
    const displayUrl =
      stringValue.length > 60 ? stringValue.slice(0, 57) + '...' : stringValue;
    return (
      <a
        href={stringValue}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline-offset-4 hover:underline"
        title={stringValue}
      >
        {displayUrl}
      </a>
    );
  }

  if (format === 'image') {
    if (!isSafeUrl(stringValue)) {
      return <span className="break-all">{stringValue}</span>;
    }
    return (
      <img
        src={stringValue}
        alt=""
        className="max-h-32 max-w-full rounded border border-dividers object-contain"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    );
  }

  if (format === 'date' || format === 'datetime') {
    const date = new Date(stringValue);
    if (!isNaN(date.getTime())) {
      return (
        <span title={date.toISOString()}>
          {formatUtils.formatDateWithTime(date, false)}
        </span>
      );
    }
  }

  if (format === 'html') {
    return <Badge variant="outline">HTML</Badge>;
  }

  if (format === 'boolean') {
    return <span>{value ? 'Yes' : 'No'}</span>;
  }

  if (format === 'filesize') {
    const bytes = toFiniteNumber(value);
    if (bytes !== undefined) {
      return <span>{formatFileSize(bytes)}</span>;
    }
  }

  if (format === 'duration') {
    const ms = toFiniteNumber(value);
    if (ms !== undefined) {
      return <span>{formatUtils.formatDuration(ms, false)}</span>;
    }
  }

  if (format === 'number') {
    const n = toFiniteNumber(value);
    if (n !== undefined) {
      return <span>{formatUtils.formatNumber(n)}</span>;
    }
  }

  if (format === 'currency') {
    const n = toFiniteNumber(value);
    if (n !== undefined) {
      return (
        <span>
          {new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: DEFAULT_CURRENCY,
          }).format(n)}
        </span>
      );
    }
  }

  return (
    <span
      className="break-all"
      title={stringValue.length > 40 ? stringValue : undefined}
    >
      {stringValue}
    </span>
  );
}

function PrimitiveArrayPreview({
  items,
  format,
}: {
  items: unknown[];
  format: FieldFormat | undefined;
}) {
  if (items.length === 0) {
    return <span className="text-muted-foreground italic">{t('empty')}</span>;
  }
  const parts = items.map((item, idx) => (
    <span key={`${idx}-${String(item)}`}>
      {idx > 0 && <span className="text-muted-foreground">, </span>}
      <FormatSingleValue value={item} format={format} />
    </span>
  ));
  return <span className="break-words">{parts}</span>;
}

function FormatValue({ value, field }: FormatValueProps) {
  const [expanded, setExpanded] = useState(false);

  if (isNil(value) || value === '') {
    return <span className="text-muted-foreground italic">{t('empty')}</span>;
  }

  if (Array.isArray(value) && !field.listItems) {
    if (hintUtils.isPrimitiveArray(value)) {
      return <PrimitiveArrayPreview items={value} format={field.format} />;
    }
    return (
      <Badge variant="outline">
        {value.length} {t('items')}
      </Badge>
    );
  }

  if (isObject(value)) {
    return (
      <Badge variant="outline">
        {Object.keys(value).length} {t('fields')}
      </Badge>
    );
  }

  const stringValue = String(value);

  if (stringValue.length > MAX_TEXT_LENGTH && !expanded) {
    return (
      <div>
        <span className="break-all">
          {stringValue.slice(0, MAX_TEXT_LENGTH)}...
        </span>
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className={cn(
            'ml-1 inline-flex items-center text-xs text-primary hover:underline',
          )}
        >
          {t('Show more')}
          <ChevronDown className="ml-0.5 h-3 w-3" />
        </button>
      </div>
    );
  }

  if (stringValue.length > MAX_TEXT_LENGTH && expanded) {
    return (
      <div>
        <span className="break-all">{stringValue}</span>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className={cn(
            'ml-1 inline-flex items-center text-xs text-primary hover:underline',
          )}
        >
          {t('Show less')}
          <ChevronUp className="ml-0.5 h-3 w-3" />
        </button>
      </div>
    );
  }

  return <FormatSingleValue value={value} format={field.format} />;
}

export {
  FormatValue,
  FormatSingleValue,
  resolveValue,
  getValueByDotPath,
  isSafeUrl,
  isSafeEmail,
};

type FormatValueProps = {
  value: unknown;
  field: HintField;
};
