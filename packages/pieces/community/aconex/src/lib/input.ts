import { AconexError } from './errors';

const NUMERIC_ID = /^[0-9]{1,32}$/;

export function assertNumericId(id: string, label: string): string {
  if (!NUMERIC_ID.test(id)) {
    throw new AconexError('INVALID_ID', `${label} must be a numeric Aconex id.`);
  }
  return id;
}

export function resolvePageSize(value: number | null | undefined): number {
  if (value === undefined || value === null) {
    return 25;
  }
  if (!Number.isInteger(value) || value < 25 || value > 500 || value % 25 !== 0) {
    throw new AconexError('INVALID_PAGE_SIZE', 'Page size must be a multiple of 25, from 25 through 500.');
  }
  return value;
}

export function resolvePageNumber(value: number | null | undefined): number {
  if (value === undefined || value === null) {
    return 1;
  }
  if (!Number.isInteger(value) || value < 1) {
    throw new AconexError('INVALID_PAGE', 'Page number must be an integer of 1 or more.');
  }
  return value;
}

export function normalizeMailBox(value: string, casing: 'lower' | 'upper'): string {
  const lower = value.trim().toLowerCase();
  if (lower !== 'inbox' && lower !== 'sentbox') {
    throw new AconexError('INVALID_MAILBOX', 'Mailbox must be inbox or sentbox.');
  }
  return casing === 'upper' ? lower.toUpperCase() : lower;
}
