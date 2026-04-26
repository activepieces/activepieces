import { isNil } from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { formatUtils } from '@/lib/format-utils';
import { cn } from '@/lib/utils';

import { HintField, FieldFormat } from './types';

const MAX_TEXT_LENGTH = 200;

function parsePath(path: string): Array<string | number> {
  const segments: Array<string | number> = [];
  let i = 0;
  let buf = '';
  const flushBuf = () => {
    if (buf.length > 0) {
      segments.push(buf);
      buf = '';
    }
  };
  while (i < path.length) {
    const ch = path[i];
    if (ch === '.') {
      flushBuf();
      i++;
    } else if (ch === '[') {
      flushBuf();
      i++;
      if (path[i] === '"' || path[i] === "'") {
        const quote = path[i];
        i++;
        let key = '';
        while (i < path.length && path[i] !== quote) {
          if (path[i] === '\\' && i + 1 < path.length) {
            key += path[i + 1];
            i += 2;
          } else {
            key += path[i];
            i++;
          }
        }
        i++;
        while (i < path.length && path[i] !== ']') i++;
        i++;
        segments.push(key);
      } else {
        let num = '';
        while (i < path.length && path[i] !== ']') {
          num += path[i];
          i++;
        }
        i++;
        const n = parseInt(num, 10);
        segments.push(isNaN(n) ? num : n);
      }
    } else {
      buf += ch;
      i++;
    }
  }
  flushBuf();
  return segments;
}

const COMMON_WRAPPERS = [
  'properties',
  'data',
  'body',
  'payload',
  'result',
  'response',
  'value',
  'attributes',
  'fields',
];

function resolveSegments(
  obj: unknown,
  segments: Array<string | number>,
): unknown {
  let current: unknown = obj;
  for (const segment of segments) {
    if (isNil(current) || typeof current !== 'object') return undefined;
    if (Array.isArray(current)) {
      const idx =
        typeof segment === 'number' ? segment : parseInt(String(segment), 10);
      current = current[idx];
    } else {
      current = (current as Record<string, unknown>)[String(segment)];
    }
  }
  return current;
}

function getValueByDotPath(obj: unknown, path: string): unknown {
  if (path === '') return obj;
  if (isNil(obj) || typeof obj !== 'object') return undefined;
  const segments = parsePath(path);
  const direct = resolveSegments(obj, segments);
  if (!isNil(direct)) return direct;

  if (segments.length === 0 || !obj || typeof obj !== 'object') return direct;
  const rootKeys = Object.keys(obj as Record<string, unknown>);
  for (const wrapper of COMMON_WRAPPERS) {
    if (!rootKeys.includes(wrapper)) continue;
    if (segments[0] === wrapper) continue;
    const fallback = resolveSegments(obj, [wrapper, ...segments]);
    if (!isNil(fallback)) return fallback;
  }
  return direct;
}

function resolveValue(json: unknown, field: HintField): unknown {
  const path = field.v ?? field.k;
  return getValueByDotPath(json, path);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
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

  if (format === 'filesize' && typeof value === 'number') {
    return <span>{formatFileSize(value)}</span>;
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

type FormatValueProps = {
  value: unknown;
  field: HintField;
};

function FormatValue({ value, field }: FormatValueProps) {
  const [expanded, setExpanded] = useState(false);

  if (isNil(value) || value === '') {
    return <span className="text-muted-foreground italic">{t('empty')}</span>;
  }

  const isArrayWithItems = Array.isArray(value) && !field.li;

  if (isArrayWithItems) {
    return (
      <Badge variant="outline">
        {value.length} {t('items')}
      </Badge>
    );
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    return <Badge variant="outline">{Object.keys(value).length} fields</Badge>;
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

  return <FormatSingleValue value={value} format={field.f} />;
}

export { FormatValue, FormatSingleValue, resolveValue, getValueByDotPath };
