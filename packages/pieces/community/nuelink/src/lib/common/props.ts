import { AppConnectionType, Property } from '@activepieces/pieces-framework';
import { NuelinkAuthValue, nuelinkAuths } from '../auth';
import { NuelinkApiError, nuelinkClient } from './client';

export const nuelinkProps = {
  brand,
  collection,
  channel,
  page,
  perPage,
  sortOrder,
};

function brand() {
  return Property.Dropdown<number, true, typeof nuelinkAuths>({
    auth: nuelinkAuths,
    displayName: 'Brand',
    description: 'The Nuelink brand (workspace) to use.',
    required: true,
    refreshers: [],
    options: async ({ auth }) =>
      dropdownOptions({
        auth,
        what: 'brands',
        needsBrand: false,
        load: async ({ apiKey }) => {
          const { items, truncated } = await nuelinkClient.listAllPages({ apiKey, path: ['brands'] });
          return {
            truncated,
            options: items.flatMap((item) => {
              const id = item['id'];
              if (typeof id !== 'number') {
                return [];
              }
              const title = textOr({ value: item['title'], fallback: `Brand ${id}` });
              const timezone = typeof item['timezone'] === 'string' ? ` (${item['timezone']})` : '';
              return [{ label: `${title}${timezone}`, value: id }];
            }),
          };
        },
      }),
  });
}

function collection<R extends boolean>({ required, description }: { required: R; description: string }) {
  return Property.Dropdown<number, R, typeof nuelinkAuths>({
    auth: nuelinkAuths,
    displayName: 'Collection',
    description,
    required,
    refreshers: ['brand'],
    options: async ({ auth, brand }) =>
      dropdownOptions({
        auth,
        what: 'collections',
        needsBrand: true,
        brand,
        load: async ({ apiKey, brandId }) => {
          const { items, truncated } = await nuelinkClient.listAllPages({ apiKey, path: ['brands', brandId, 'collections'] });
          return {
            truncated,
            options: items.flatMap((item) => {
              const id = item['id'];
              if (typeof id !== 'number') {
                return [];
              }
              const title = textOr({ value: item['title'], fallback: `Collection ${id}` });
              const channels = Array.isArray(item['channels']) ? item['channels'].length : 0;
              const paused = item['status'] === 'PAUSED' ? ', paused' : '';
              return [{ label: `${title} (${channels} ${channels === 1 ? 'channel' : 'channels'}${paused})`, value: id }];
            }),
          };
        },
      }),
  });
}

function channel() {
  return Property.Dropdown<number, false, typeof nuelinkAuths>({
    auth: nuelinkAuths,
    displayName: 'Channel',
    description: 'Only return results for this social channel.',
    required: false,
    refreshers: ['brand'],
    options: async ({ auth, brand }) =>
      dropdownOptions({
        auth,
        what: 'channels',
        needsBrand: true,
        brand,
        load: async ({ apiKey, brandId }) => {
          const { items, truncated } = await nuelinkClient.listAllPages({ apiKey, path: ['brands', brandId, 'channels'] });
          return {
            truncated,
            options: items.flatMap((item) => {
              const id = item['id'];
              if (typeof id !== 'number') {
                return [];
              }
              const name = textOr({ value: item['name'], fallback: `Channel ${id}` });
              const type = typeof item['type'] === 'string' ? ` (${item['type']})` : '';
              return [{ label: `${name}${type}`, value: id }];
            }),
          };
        },
      }),
  });
}

function page() {
  return Property.Number({
    displayName: 'Page',
    description: 'Which page of results to return, starting at 1. When the output says hasMore is true, run again with the next page number.',
    required: false,
    defaultValue: 1,
  });
}

function perPage() {
  return Property.Number({
    displayName: 'Results per Page',
    description: 'How many results to return per page (1 to 100).',
    required: false,
    defaultValue: 25,
  });
}

function sortOrder() {
  return Property.StaticDropdown({
    displayName: 'Sort Order',
    required: false,
    defaultValue: 'desc',
    options: {
      options: [
        { label: 'Newest / highest first', value: 'desc' },
        { label: 'Oldest / lowest first', value: 'asc' },
      ],
    },
  });
}

async function dropdownOptions({
  auth,
  what,
  needsBrand,
  brand,
  load,
}: {
  auth: NuelinkAuthValue | undefined;
  what: string;
  needsBrand: boolean;
  brand?: unknown;
  load: (params: { apiKey: string; brandId: string }) => Promise<{ options: { label: string; value: number }[]; truncated: boolean }>;
}) {
  if (auth === undefined) {
    return { disabled: true, options: [], placeholder: 'Connect your Nuelink account first.' };
  }
  if (auth.type !== AppConnectionType.CUSTOM_AUTH) {
    return { disabled: true, options: [], placeholder: 'This needs a Nuelink API Key connection. Automation tokens only work with Create Post.' };
  }
  const brandId = needsBrand ? brandIdOf({ value: brand }) : '';
  if (needsBrand && brandId.length === 0) {
    return { disabled: true, options: [], placeholder: 'Select a brand first.' };
  }
  try {
    const apiKey = nuelinkClient.apiKeyOf({ auth });
    const { options, truncated } = await load({ apiKey, brandId });
    if (options.length === 0) {
      return { disabled: false, options: [], placeholder: `No ${what} found in Nuelink.` };
    }
    return {
      disabled: false,
      options,
      placeholder: truncated ? `Showing the first ${options.length} ${what}. Use the ${what} ID in a custom value for others.` : undefined,
    };
  } catch (error) {
    return { disabled: true, options: [], placeholder: dropdownError({ error, what }) };
  }
}

function brandIdOf({ value }: { value: unknown }): string {
  try {
    return nuelinkClient.numericId({ value, label: 'Brand' });
  } catch {
    return '';
  }
}

function dropdownError({ error, what }: { error: unknown; what: string }): string {
  if (error instanceof NuelinkApiError) {
    if (error.status === 401) {
      return 'Nuelink did not accept the API key (401). It may have expired; generate a new one and update the connection.';
    }
    if (error.status === 429) {
      return 'Nuelink rate limit reached (429). Wait a minute and reopen this list.';
    }
    return `Could not load ${what} from Nuelink (HTTP ${error.status}).`;
  }
  return `Could not load ${what} from Nuelink. Check the connection and try again.`;
}

function textOr({ value, fallback }: { value: unknown; fallback: string }): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}
