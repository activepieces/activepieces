import type { Bind } from 'snowflake-sdk';
import { qualifiedName, toBind, valuePlaceholder } from './sql';

const JSON_TYPES = new Set(['VARIANT', 'OBJECT', 'ARRAY']);

export function buildCall({
  procedure,
  args,
  preQualified = false,
  argTypes = [],
}: {
  procedure: string;
  args: unknown[];
  preQualified?: boolean;
  argTypes?: string[];
}): { sql: string; binds: Bind[] } {
  const name = preQualified
    ? procedure
    : qualifiedName({ value: procedure, label: 'Procedure' });
  const binds: Bind[] = [];
  const placeholders: string[] = [];
  args.forEach((arg, index) => {
    const type = (argTypes[index] ?? '').toUpperCase();
    if (typeof arg === 'string' && JSON_TYPES.has(type)) {
      binds.push(isJsonText(arg) ? arg : JSON.stringify(arg));
      placeholders.push('PARSE_JSON(?)');
      return;
    }
    binds.push(toBind(arg));
    placeholders.push(valuePlaceholder(arg));
  });
  return { sql: `CALL ${name}(${placeholders.join(', ')})`, binds };
}

export function parseSignatureArgTypes(signature: string): string[] {
  const open = signature.indexOf('(');
  const close = signature.indexOf(')', open + 1);
  if (open === -1 || close === -1) return [];
  const inner = signature.substring(open + 1, close).trim();
  if (inner === '') return [];
  return inner.split(',').map((part) => {
    const words = part.trim().split(/\s+/);
    return words[words.length - 1] ?? '';
  });
}

function isJsonText(value: string): boolean {
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
}
