import { Property, Store } from '@activepieces/pieces-framework';
import { zohoCrmAuth } from '../auth';
import { ZohoAuth, ZohoCrmError, errorText, stringList } from './client';
import { defaultFieldSelection, listFields } from './metadata';
import { CURSOR_KEY, PollCursor, ZohoRecord, collectSince, initCursor, modulePageFetcher, startCursor, zohoNow } from './polling';
import { moduleDropdown } from './props';
import { tryListFields } from './records';

export const recordTriggerProps = {
  module: moduleDropdown({ description: 'The module to watch (standard or custom).' }),
  fields: Property.MultiSelectDropdown({
    auth: zohoCrmAuth,
    displayName: 'Fields to Include',
    description:
      'Optional, up to 47. Leave empty for id, then custom, then standard fields (50 in total).',
    required: false,
    refreshers: ['module'],
    options: async ({ auth, module }) => {
      if (!auth || typeof module !== 'string' || module.length === 0) {
        return { disabled: true, options: [], placeholder: 'Select a module first' };
      }
      try {
        const fields = await listFields({ auth, module });
        return {
          disabled: false,
          options: fields
            .filter((f) => f.visible !== false)
            .map((f) => ({ label: f.display_label ?? f.field_label ?? f.api_name, value: f.api_name })),
        };
      } catch (error) {
        return { disabled: true, options: [], placeholder: `Could not load fields: ${errorText(error)}` };
      }
    },
  }),
};

export async function pollModule({
  auth,
  store,
  module,
  fields,
  sortBy,
  keep,
  apiVersion,
}: {
  auth: ZohoAuth;
  store: Store;
  module: string;
  fields: string[];
  sortBy: 'Created_Time' | 'Modified_Time';
  keep?: (record: ZohoRecord) => boolean;
  apiVersion?: string;
}): Promise<ZohoRecord[]> {
  const cursor = (await store.get<PollCursor>(CURSOR_KEY)) ?? startCursor(Date.now());
  const result = await collectSince({
    cursor,
    timeField: sortBy,
    fetchPage: modulePageFetcher({ auth, module, fields, sortBy, apiVersion }),
  });
  await store.put<PollCursor>(CURSOR_KEY, result.cursor);
  return keep ? result.records.filter(keep) : result.records;
}

export async function sampleModule({
  auth,
  module,
  fields,
  sortBy,
  keep,
  apiVersion,
}: {
  auth: ZohoAuth;
  module: string;
  fields: string[];
  sortBy: 'Created_Time' | 'Modified_Time';
  keep?: (record: ZohoRecord) => boolean;
  apiVersion?: string;
}): Promise<ZohoRecord[]> {
  const { records } = await modulePageFetcher({ auth, module, fields, sortBy, apiVersion })({});
  return (keep ? records.filter(keep) : records).slice(0, 5);
}

export async function triggerFields({
  auth,
  store,
  module,
  chosen,
}: {
  auth: ZohoAuth;
  store?: Store;
  module: string;
  chosen: unknown;
}): Promise<string[]> {
  const picked = pickedFields(chosen);
  if (picked.length > 0) {
    return [...new Set([...ALWAYS_INCLUDED, ...picked])];
  }
  const cached = store ? await store.get<CachedFields>(FIELDS_KEY) : null;
  if (cached && cached.module === module && Date.now() - cached.at < FIELDS_CACHE_MS) {
    return cached.fields;
  }
  const available = await tryListFields({ auth, module });
  if (!available) {
    throw new ZohoCrmError(
      `Zoho CRM did not let this connection read the ${module} field list, so the default fields cannot be chosen. Pick the fields to include in the trigger settings.`,
    );
  }
  const fields = [...new Set([...ALWAYS_INCLUDED, ...defaultFieldSelection({ fields: available })])].slice(0, MAX_FIELDS);
  if (store) {
    await store.put<CachedFields>(FIELDS_KEY, { module, fields, at: Date.now() });
  }
  return fields;
}

export async function startTrigger({
  auth,
  module,
  store,
  isRepublish,
  chosen,
}: {
  auth: ZohoAuth;
  module: string;
  store: Store;
  isRepublish?: boolean;
  chosen: unknown;
}): Promise<void> {
  pickedFields(chosen);
  await store.delete(FIELDS_KEY);
  await initCursor({ store, isRepublish, now: () => zohoNow({ auth, module }) });
}

function pickedFields(chosen: unknown): string[] {
  const picked = [...new Set(stringList(chosen).filter((f) => !ALWAYS_INCLUDED.includes(f)))];
  if (picked.length > MAX_PICKED_FIELDS) {
    throw new ZohoCrmError(
      `Fields to Include has ${picked.length} fields. Zoho returns at most ${MAX_FIELDS} fields per record, and id, Created_Time and Modified_Time are always included, so pick at most ${MAX_PICKED_FIELDS}.`,
    );
  }
  return picked;
}

const ALWAYS_INCLUDED = ['id', 'Created_Time', 'Modified_Time'];
const MAX_FIELDS = 50;
const MAX_PICKED_FIELDS = MAX_FIELDS - ALWAYS_INCLUDED.length;
const FIELDS_KEY = 'zoho_poll_fields';
const FIELDS_CACHE_MS = 6 * 60 * 60 * 1000;

type CachedFields = { module: string; fields: string[]; at: number };
