import { AppConnectionValueForAuthProperty, DropdownOption, DropdownState } from '@activepieces/pieces-framework';
import { moxieCRMAuth } from '../auth';
import { MoxieCRMClient, responseStatusOf } from './client';
import { MoxieCredentials } from './models';

export async function makeClient(auth: MoxieAuthValue): Promise<MoxieCRMClient> {
  return new MoxieCRMClient(credentialsOf({ auth }));
}

export function credentialsOf({ auth }: { auth: MoxieAuthValue }): MoxieCredentials {
  return { baseUrl: auth.props.baseUrl, apiKey: auth.props.apiKey };
}

export function reformatDate(s?: string): string | undefined {
  if (!s) return undefined;
  return s.split('T', 2)[0];
}

export async function safeOptions<T>({
  auth,
  load,
  emptyPlaceholder,
  notFoundPlaceholder,
}: {
  auth: unknown;
  load: () => Promise<DropdownOption<T>[]>;
  emptyPlaceholder?: string;
  notFoundPlaceholder?: string;
}): Promise<DropdownState<T>> {
  if (auth === undefined || auth === null) {
    return { disabled: true, options: [], placeholder: 'Connect your Moxie account first.' };
  }
  try {
    const options = await load();
    if (options.length === 0 && emptyPlaceholder !== undefined) {
      return { disabled: true, options: [], placeholder: emptyPlaceholder };
    }
    return { disabled: false, options };
  } catch (error) {
    if (responseStatusOf({ error }) === 404 && notFoundPlaceholder !== undefined) {
      return { disabled: true, options: [], placeholder: notFoundPlaceholder };
    }
    const reason = error instanceof Error ? error.message : String(error);
    return { disabled: true, options: [], placeholder: `Could not load options: ${reason}` };
  }
}

export function disabledOptions<T>({ placeholder }: { placeholder: string }): DropdownState<T> {
  return { disabled: true, options: [], placeholder };
}

export function asArray({ value }: { value: unknown }): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error('Moxie returned an unexpected response (expected a list).');
  }
  return value;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function stringField({ record, key }: { record: unknown; key: string }): string | undefined {
  if (!isRecord(record)) {
    return undefined;
  }
  const value = record[key];
  return typeof value === 'string' ? value : undefined;
}

export type MoxieAuthValue = AppConnectionValueForAuthProperty<typeof moxieCRMAuth>;
