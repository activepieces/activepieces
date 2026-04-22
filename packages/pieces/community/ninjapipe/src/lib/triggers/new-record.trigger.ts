import { createTrigger, Property, HttpMethod } from '@activepieces/pieces-framework';
import { TriggerStrategy } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { RESOURCE_CONFIG } from '../common/constants';
import { ninjapipeApiRequest } from '../common/client';
import { extractItems, flattenCustomFields, buildPairObject } from '../common/helpers';
import { PollState } from '../common/types';

const TRIGGER_RESOURCES = [
  { label: 'Contact', value: 'contact' },
  { label: 'Company', value: 'company' },
  { label: 'Deal', value: 'deal' },
  { label: 'Task', value: 'task' },
  { label: 'Databin Received', value: 'databin' },
  { label: 'Custom Path', value: 'custom' },
];

export const newRecord = createTrigger({
  auth: ninjapipeAuth,
  name: 'new_record',
  displayName: 'New or Updated Record',
  description: 'Trigger when a new or updated record is detected in NinjaPipe',
  props: {
    resource: Property.StaticDropdown({
      displayName: 'Resource',
      required: true,
      options: { options: TRIGGER_RESOURCES },
    }),
    pathOverride: Property.ShortText({
      displayName: 'Custom Path',
      description: 'Override API path (for Custom Path resource)',
      required: false,
    }),
    eventMode: Property.StaticDropdown({
      displayName: 'Event Mode',
      required: true,
      options: {
        options: [
          { label: 'New Records', value: 'new' },
          { label: 'New or Updated', value: 'newOrUpdated' },
        ],
      },
      defaultValue: 'new',
    }),
    timestampField: Property.ShortText({
      displayName: 'Timestamp Field',
      description: 'Field name for timestamp (default: created_at for new, updated_at for newOrUpdated)',
      required: false,
    }),
    idField: Property.ShortText({
      displayName: 'ID Field',
      description: 'Field name for record ID',
      required: false,
      defaultValue: 'id',
    }),
    pageSize: Property.Number({
      displayName: 'Page Size',
      description: 'Number of records to fetch per poll',
      required: false,
      defaultValue: 100,
    }),
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Search query',
      required: false,
    }),
    statusFilter: Property.ShortText({
      displayName: 'Status Filter',
      required: false,
    }),
    ownerFilter: Property.ShortText({
      displayName: 'Owner Filter',
      description: 'Filter by owner ID',
      required: false,
    }),
    queryParams: Property.Array({
      displayName: 'Query Parameters',
      required: false,
      properties: {
        field: Property.ShortText({ displayName: 'Field Name', required: true }),
        type: Property.StaticDropdown({
          displayName: 'Type',
          required: true,
          options: {
            options: [
              { label: 'String', value: 'string' },
              { label: 'Number', value: 'number' },
              { label: 'Boolean', value: 'boolean' },
              { label: 'JSON', value: 'json' },
              { label: 'Null', value: 'null' },
            ],
          },
        }),
        value: Property.ShortText({ displayName: 'Value', required: true }),
      },
    }),
    advancedQueryJson: Property.Json({
      displayName: 'Advanced Query (JSON)',
      description: 'Complex query as JSON object',
      required: false,
    }),
    flattenCustomFields: Property.Checkbox({
      displayName: 'Flatten Custom Fields',
      description: 'Flatten custom_fields object to top-level',
      required: false,
      defaultValue: true,
    }),
  },
  sampleData: {},
  type: TriggerStrategy.POLLING,
  onEnable: async (context) => {
    const { auth, propsValue, store } = context;

    const resource = propsValue.resource as string;
    let path = resource === 'custom'
      ? (propsValue.pathOverride as string)
      : `/${RESOURCE_CONFIG[resource]?.path ?? resource + 's'}`;

    const pageSize = (propsValue.pageSize as number) ?? 100;
    const qs: Record<string, unknown> = { page: 1, limit: pageSize };

    if (propsValue.search) qs.search = propsValue.search;
    if (propsValue.statusFilter) qs.status = propsValue.statusFilter;
    if (propsValue.ownerFilter) qs.owner_id = propsValue.ownerFilter;

    const queryParams = propsValue.queryParams as Array<{ field: string; type: string; value: string }> | undefined;
    if (queryParams && queryParams.length > 0) {
      const parsed = buildPairObject(queryParams) as Record<string, unknown>;
      Object.assign(qs, parsed);
    }

    const advancedQuery = propsValue.advancedQueryJson as Record<string, unknown> | undefined;
    if (advancedQuery) {
      Object.assign(qs, advancedQuery);
    }

    const response = await ninjapipeApiRequest(
      auth as { base_url: string; api_key: string },
      HttpMethod.GET,
      path,
      undefined,
      qs,
    );

    const items = extractItems(response);
    const idField = (propsValue.idField as string) ?? 'id';
    let timestampField = propsValue.timestampField as string | undefined;

    if (!timestampField) {
      timestampField = propsValue.eventMode === 'newOrUpdated' ? 'updated_at' : 'created_at';
    }

    let lastTimestamp = 0;
    const lastIdsAtTimestamp: string[] = [];

    for (const item of items) {
      const ts = item[timestampField] as number | string | undefined;
      const id = item[idField] as string | number | undefined;

      if (ts === undefined || id === undefined) continue;

      const tsNum = typeof ts === 'string' ? Date.parse(ts) : Number(ts);
      const idStr = String(id);

      if (tsNum > lastTimestamp) {
        lastTimestamp = tsNum;
        lastIdsAtTimestamp.length = 0;
        lastIdsAtTimestamp.push(idStr);
      } else if (tsNum === lastTimestamp && !lastIdsAtTimestamp.includes(idStr)) {
        lastIdsAtTimestamp.push(idStr);
      }
    }

    const state: PollState = {
      lastTimestamp,
      lastIdsAtTimestamp,
      initialized: true,
    };

    await store.put('poll_state', JSON.stringify(state));
  },
  run: async (context) => {
    const { auth, propsValue, store } = context;

    const raw = await store.get<string>('poll_state');
    let state: PollState = raw
      ? JSON.parse(raw)
      : { lastTimestamp: 0, lastIdsAtTimestamp: [], initialized: false };

    const resource = propsValue.resource as string;
    let path = resource === 'custom'
      ? (propsValue.pathOverride as string)
      : `/${RESOURCE_CONFIG[resource]?.path ?? resource + 's'}`;

    const pageSize = (propsValue.pageSize as number) ?? 100;
    const qs: Record<string, unknown> = { page: 1, limit: pageSize };

    if (propsValue.search) qs.search = propsValue.search;
    if (propsValue.statusFilter) qs.status = propsValue.statusFilter;
    if (propsValue.ownerFilter) qs.owner_id = propsValue.ownerFilter;

    const queryParams = propsValue.queryParams as Array<{ field: string; type: string; value: string }> | undefined;
    if (queryParams && queryParams.length > 0) {
      const parsed = buildPairObject(queryParams) as Record<string, unknown>;
      Object.assign(qs, parsed);
    }

    const advancedQuery = propsValue.advancedQueryJson as Record<string, unknown> | undefined;
    if (advancedQuery) {
      Object.assign(qs, advancedQuery);
    }

    const response = await ninjapipeApiRequest(
      auth as { base_url: string; api_key: string },
      HttpMethod.GET,
      path,
      undefined,
      qs,
    );

    const items = extractItems(response);
    const idField = (propsValue.idField as string) ?? 'id';
    let timestampField = propsValue.timestampField as string | undefined;

    if (!timestampField) {
      timestampField = propsValue.eventMode === 'newOrUpdated' ? 'updated_at' : 'created_at';
    }

    const newItems: unknown[] = [];
    let newLastTimestamp = state.lastTimestamp;
    const newLastIdsAtTimestamp: string[] = [...state.lastIdsAtTimestamp];

    for (const item of items) {
      const ts = item[timestampField] as number | string | undefined;
      const id = item[idField] as string | number | undefined;

      if (ts === undefined || id === undefined) continue;

      const tsNum = typeof ts === 'string' ? Date.parse(ts) : Number(ts);
      const idStr = String(id);

      const isNew = tsNum > state.lastTimestamp ||
        (tsNum === state.lastTimestamp && !state.lastIdsAtTimestamp.includes(idStr));

      if (isNew) {
        const processedItem = propsValue.flattenCustomFields
          ? flattenCustomFields(item as Record<string, unknown>)
          : item;
        newItems.push(processedItem);

        if (tsNum > newLastTimestamp) {
          newLastTimestamp = tsNum;
          newLastIdsAtTimestamp.length = 0;
          newLastIdsAtTimestamp.push(idStr);
        } else if (tsNum === newLastTimestamp && !newLastIdsAtTimestamp.includes(idStr)) {
          newLastIdsAtTimestamp.push(idStr);
        }
      }
    }

    const newState: PollState = {
      lastTimestamp: newLastTimestamp,
      lastIdsAtTimestamp: newLastIdsAtTimestamp,
      initialized: true,
    };

    await store.put('poll_state', JSON.stringify(newState));

    return newItems;
  },
  onDisable: async (context) => {
    await context.store.delete('poll_state');
  },
  test: async (context) => {
    const { auth, propsValue } = context;

    const resource = propsValue.resource as string;
    let path = resource === 'custom'
      ? (propsValue.pathOverride as string)
      : `/${RESOURCE_CONFIG[resource]?.path ?? resource + 's'}`;

    const pageSize = (propsValue.pageSize as number) ?? 10;
    const qs: Record<string, unknown> = { page: 1, limit: pageSize };

    if (propsValue.search) qs.search = propsValue.search;
    if (propsValue.statusFilter) qs.status = propsValue.statusFilter;
    if (propsValue.ownerFilter) qs.owner_id = propsValue.ownerFilter;

    const queryParams = propsValue.queryParams as Array<{ field: string; type: string; value: string }> | undefined;
    if (queryParams && queryParams.length > 0) {
      const parsed = buildPairObject(queryParams) as Record<string, unknown>;
      Object.assign(qs, parsed);
    }

    const advancedQuery = propsValue.advancedQueryJson as Record<string, unknown> | undefined;
    if (advancedQuery) {
      Object.assign(qs, advancedQuery);
    }

    const response = await ninjapipeApiRequest(
      auth as { base_url: string; api_key: string },
      HttpMethod.GET,
      path,
      undefined,
      qs,
    );

    const items = extractItems(response);

    if (propsValue.flattenCustomFields) {
      return items.map((item) => flattenCustomFields(item as Record<string, unknown>));
    }

    return items;
  },
});
