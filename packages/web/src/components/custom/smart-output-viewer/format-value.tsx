import { isNil, isObject } from '@activepieces/shared';
import { t } from 'i18next';

import { Badge } from '@/components/ui/badge';
import { formatUtils } from '@/lib/format-utils';
import { pathUtils } from '@/lib/path-utils';

import { hintUtils } from './resolve-hints';
import { HintField, FieldFormat } from './types';

const SAFE_URL_PROTOCOLS = new Set(['http:', 'https:']);

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

function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    if (v === 'false' || v === '0' || v === 'no' || v === 'off') return false;
    return v !== '';
  }
  return Boolean(value);
}

function formatCurrency(n: number, currency: string | undefined): string {
  if (!currency) return formatUtils.formatNumber(n);
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
    }).format(n);
  } catch {
    return formatUtils.formatNumber(n);
  }
}

function FormatSingleValue({
  value,
  format,
  currency,
}: {
  value: unknown;
  format: FieldFormat | undefined;
  currency?: string;
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
        href={`mailto:${stringValue}`}
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
    return (
      <a
        href={stringValue}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline-offset-4 hover:underline break-all"
      >
        {stringValue}
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
    return <span>{toBoolean(value) ? t('Yes') : t('No')}</span>;
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
      return <span>{formatCurrency(n, currency)}</span>;
    }
  }

  return <span className="break-words whitespace-pre-wrap">{stringValue}</span>;
}

function PrimitiveArrayPreview({
  items,
  format,
  currency,
}: {
  items: unknown[];
  format: FieldFormat | undefined;
  currency?: string;
}) {
  if (items.length === 0) {
    return <span className="text-muted-foreground italic">{t('empty')}</span>;
  }
  const parts = items.map((item, idx) => (
    <span key={`${idx}-${String(item)}`}>
      {idx > 0 && <span className="text-muted-foreground">, </span>}
      <FormatSingleValue value={item} format={format} currency={currency} />
    </span>
  ));
  return <span className="break-words">{parts}</span>;
}

function FormatValue({ value, field }: FormatValueProps) {
  if (isNil(value) || value === '') {
    return <span className="text-muted-foreground italic">{t('empty')}</span>;
  }

  if (Array.isArray(value) && !field.listItems) {
    if (hintUtils.isPrimitiveArray(value)) {
      return (
        <PrimitiveArrayPreview
          items={value}
          format={field.format}
          currency={field.currency}
        />
      );
    }
    return (
      <Badge variant="outline">{t('itemCount', { count: value.length })}</Badge>
    );
  }

  if (isObject(value)) {
    return (
      <Badge variant="outline">
        {t('fieldCount', { count: Object.keys(value).length })}
      </Badge>
    );
  }

  return (
    <FormatSingleValue
      value={value}
      format={field.format}
      currency={field.currency}
    />
  );
}

export {
  FormatValue,
  FormatSingleValue,
  resolveValue,
  getValueByDotPath,
  isSafeUrl,
  isSafeEmail,
  toBoolean,
  formatCurrency,
};

type FormatValueProps = {
  value: unknown;
  field: HintField;
};
