function record(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? Object.fromEntries(Object.entries(value)) : {};
}

function records(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.map(record) : [];
}

function text(value: unknown): string | null {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return null;
}

function flatten({ value, prefix = '' }: { value: unknown; prefix?: string }): Record<string, unknown> {
  const source = record(value);
  return Object.entries(source).reduce<Record<string, unknown>>((acc, [key, item]) => {
    const name = prefix ? `${prefix}_${toSnake(key)}` : toSnake(key);
    if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
      return { ...acc, ...flatten({ value: item, prefix: name }) };
    }
    if (Array.isArray(item)) {
      return item.every((entry) => typeof entry !== 'object' || entry === null) ? { ...acc, [name]: item.join(', ') } : acc;
    }
    return { ...acc, [name]: item };
  }, {});
}

function linkUrl({ response, label }: { response: Record<string, unknown>; label: string }): string | null {
  const link = records(response['uiLinks']).find((entry) => text(entry['label']) === label);
  return link ? text(link['url']) : null;
}

function toSnake(key: string): string {
  return key.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
}

export const readUtils = { record, records, text, flatten, linkUrl };
