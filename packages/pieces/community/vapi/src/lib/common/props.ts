import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { vapiAuth } from '../auth';
import { vapiApi, vapiUtils } from './vapi-api';

const FINDER_SCAN_LIMIT = 1000;

async function listResources({ apiKey, path, operation, limit }: { apiKey: string; path: string; operation: string; limit: number }) {
  const response = await vapiApi.request<unknown>({
    apiKey,
    method: HttpMethod.GET,
    path,
    operation,
    query: { limit },
  });
  return vapiUtils.asArray(response).map((item) => vapiUtils.stripSecrets(item));
}

async function findResources<T>({
  apiKey,
  path,
  operation,
  flatten,
  matches,
  limit,
}: {
  apiKey: string;
  path: string;
  operation: string;
  flatten: (item: Record<string, unknown>) => T;
  matches: (item: T) => boolean;
  limit: number;
}): Promise<{ items: T[]; truncated: boolean }> {
  const items = await listResources({ apiKey, path, operation, limit: FINDER_SCAN_LIMIT });
  const truncated = items.length >= FINDER_SCAN_LIMIT;
  const result: T[] = [];
  for (const item of items) {
    const flat = flatten(item);
    if (matches(flat)) {
      result.push(flat);
      if (result.length >= limit) {
        break;
      }
    }
  }
  return { items: result, truncated: truncated && result.length < limit };
}

function readPath({ item, path }: { item: Record<string, unknown>; path: string }): unknown {
  let current: unknown = item;
  for (const segment of path.split('.')) {
    if (!vapiUtils.isRecord(current)) {
      return undefined;
    }
    current = current[segment];
  }
  return current;
}

function labelFor({ item, keys }: { item: Record<string, unknown>; keys: string[] }): string {
  const id = typeof item['id'] === 'string' ? item['id'] : '';
  for (const key of keys) {
    const value = readPath({ item, path: key });
    if (typeof value === 'string' && value.length > 0) {
      return `${value} (${id})`;
    }
  }
  return id;
}

function resourceDropdown({
  displayName,
  description,
  required,
  path,
  noun,
  labelKeys,
}: {
  displayName: string;
  description: string;
  required: boolean;
  path: string;
  noun: string;
  labelKeys: string[];
}) {
  return Property.Dropdown({
    auth: vapiAuth,
    displayName,
    description,
    required,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: 'Connect your Vapi account first.' };
      }
      try {
        const items = await listResources({ apiKey: auth.secret_text, path, operation: `list ${noun}`, limit: 1000 });
        return {
          disabled: false,
          options: items
            .filter((item) => typeof item['id'] === 'string')
            .map((item) => ({ label: labelFor({ item, keys: labelKeys }), value: String(item['id']) })),
          placeholder:
            items.length === 0
              ? `No ${noun} found in this Vapi organization.`
              : items.length >= FINDER_SCAN_LIMIT
                ? `Showing the first ${FINDER_SCAN_LIMIT}; enter the ID manually if yours isn't listed.`
                : undefined,
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: error instanceof Error ? error.message : `Could not load ${noun}.`,
        };
      }
    },
  });
}

function assistantDropdown({ required, description }: { required: boolean; description?: string }) {
  return resourceDropdown({
    displayName: 'Assistant',
    description: description ?? 'The Vapi assistant.',
    required,
    path: '/assistant',
    noun: 'assistants',
    labelKeys: ['name'],
  });
}

function phoneNumberDropdown({ required, description }: { required: boolean; description?: string }) {
  return resourceDropdown({
    displayName: 'Phone Number',
    description: description ?? 'A phone number in your Vapi organization.',
    required,
    path: '/phone-number',
    noun: 'phone numbers',
    labelKeys: ['number', 'name', 'sipUri'],
  });
}

function toolDropdown({ required, description }: { required: boolean; description?: string }) {
  return resourceDropdown({
    displayName: 'Tool',
    description: description ?? 'A tool in your Vapi organization.',
    required,
    path: '/tool',
    noun: 'tools',
    labelKeys: ['function.name', 'name', 'type'],
  });
}

function squadDropdown({ required, description }: { required: boolean; description?: string }) {
  return resourceDropdown({
    displayName: 'Squad',
    description: description ?? 'A squad in your Vapi organization.',
    required,
    path: '/squad',
    noun: 'squads',
    labelKeys: ['name'],
  });
}

function fileDropdown({ required, description }: { required: boolean; description?: string }) {
  return resourceDropdown({
    displayName: 'File',
    description: description ?? 'A knowledge-base file in your Vapi organization.',
    required,
    path: '/file',
    noun: 'files',
    labelKeys: ['name', 'originalName'],
  });
}

export const vapiProps = {
  assistantDropdown,
  phoneNumberDropdown,
  toolDropdown,
  squadDropdown,
  fileDropdown,
};

export const vapiResources = {
  list: listResources,
  find: findResources,
};

