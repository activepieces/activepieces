import type { RedshiftTable } from './types';

function quoteIdentifier({ name }: { name: string }): string {
  return `"${name.replace(/"/g, '""')}"`;
}

function qualifiedName({ table }: { table: RedshiftTable }): string {
  return `${quoteIdentifier({ name: table.table_schema })}.${quoteIdentifier({ name: table.table_name })}`;
}

function filledFields({ values }: { values: unknown }): Record<string, unknown> {
  if (typeof values !== 'object' || values === null || Array.isArray(values)) {
    return {};
  }
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined && value !== null && value !== ''));
}

export const redshiftUtils = { quoteIdentifier, qualifiedName, filledFields };
