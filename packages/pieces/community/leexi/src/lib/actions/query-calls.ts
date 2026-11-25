import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { leexiAuth } from '../common/auth';
import { leexiApi } from '../common/client';
import { LeexiCall, LeexiListResponse } from '../common/types';
import { leexiOutputFields } from '../common/constants';

function cleanList(values: unknown[] | undefined): string[] | undefined {
  if (!values) {
    return undefined;
  }
  const result = values
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.trim())
    .filter((value) => value !== '');
  return result.length > 0 ? result : undefined;
}

function toIso(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date "${value}". Use an ISO 8601 date such as 2026-01-31T00:00:00.000Z.`);
  }
  return date.toISOString();
}

function clampInt({ value, min, max, fallback }: { value: number | undefined; min: number; max: number; fallback: number }): number {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, Math.floor(value)));
}

function slimCall(call: LeexiCall) {
  return {
    uuid: call.uuid,
    title: call.title ?? null,
    created_at: call.created_at,
    performed_at: call.performed_at ?? null,
    duration: call.duration ?? null,
    direction: call.direction ?? null,
    locale: call.locale ?? null,
    source: call.source ?? null,
    leexi_url: call.leexi_url ?? null,
    conversation_type: call.conversation_type ?? null,
    owner: call.owner ?? null,
    participating_users: call.participating_users ?? [],
    customers: call.customers ?? [],
  };
}

export const queryCallsAction = createAction({
  name: 'query_calls',
  classification: 'SEARCH',
  auth: leexiAuth,
  displayName: 'Query Calls',
  description: 'Search Leexi calls by date, people, customer or conversation type.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches Leexi calls/meetings and returns call metadata (uuid, title, performed_at, duration, direction, owner, participants, customers, leexi_url) without summary or transcript, plus pagination. Filter by period (from/to on created_at, performed_at or updated_at), participating user UUIDs, owner UUIDs (get them from List Users), customer email addresses or phone numbers, conversation type UUID and source. Team, direction and transcript-keyword filters are not supported by the API. Use the returned uuid values with Fetch Call Details, Fetch Call Transcript or List Call Notes. Read-only.',
    idempotent: true,
  },
  outputSchema: {
    fields: [
      { key: 'calls', label: 'Calls', listItems: leexiOutputFields.callSummary, labelKey: 'title' },
      { key: 'pagination', label: 'Pagination', children: leexiOutputFields.pagination },
    ],
  },
  props: {
    from: Property.DateTime({
      displayName: 'From',
      description: 'Only calls on or after this time (see Date Filter).',
      required: false,
    }),
    to: Property.DateTime({
      displayName: 'To',
      description: 'Only calls on or before this time (see Date Filter).',
      required: false,
    }),
    date_filter: Property.StaticDropdown({
      displayName: 'Date Filter',
      description: 'Which call date From/To apply to. Defaults to created_at.',
      required: false,
      options: {
        options: [
          { label: 'Created At', value: 'created_at' },
          { label: 'Performed At', value: 'performed_at' },
          { label: 'Updated At', value: 'updated_at' },
        ],
      },
    }),
    participating_user_uuids: Property.Array({
      displayName: 'Participating User UUIDs',
      description: 'Leexi user UUIDs that took part in the call. Get them from List Users.',
      required: false,
    }),
    owner_uuids: Property.Array({
      displayName: 'Owner UUIDs',
      description: 'Leexi user UUIDs that own the call. Get them from List Users.',
      required: false,
    }),
    customer_email_addresses: Property.Array({
      displayName: 'Customer Email Addresses',
      description: 'Email addresses of external customers on the call.',
      required: false,
    }),
    customer_phone_numbers: Property.Array({
      displayName: 'Customer Phone Numbers',
      description: 'Customer phone numbers on the call, in international format.',
      required: false,
    }),
    conversation_type_uuid: Property.ShortText({
      displayName: 'Conversation Type UUID',
      description: 'Only calls of this type (conversation_type.uuid on a call).',
      required: false,
    }),
    source: Property.ShortText({
      displayName: 'Source',
      description: 'Only return calls from this source (e.g. aircall, zoom, google_meet).',
      required: false,
    }),
    order: Property.StaticDropdown({
      displayName: 'Order',
      description: 'Sort order. Defaults to newest created first.',
      required: false,
      options: {
        options: [
          { label: 'Created At (newest first)', value: 'created_at desc' },
          { label: 'Created At (oldest first)', value: 'created_at asc' },
          { label: 'Performed At (newest first)', value: 'performed_at desc' },
          { label: 'Performed At (oldest first)', value: 'performed_at asc' },
          { label: 'Updated At (newest first)', value: 'updated_at desc' },
          { label: 'Updated At (oldest first)', value: 'updated_at asc' },
        ],
      },
    }),
    items: Property.Number({
      displayName: 'Results per Page',
      description: 'Number of calls per page, 1-100. Defaults to 20.',
      required: false,
      defaultValue: 20,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number, from 1. Stop at pagination.pages.',
      required: false,
      defaultValue: 1,
    }),
  },
  async run(context) {
    const p = context.propsValue;
    const response = await leexiApi.request<LeexiListResponse<LeexiCall>>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: ['calls'],
      query: {
        page: clampInt({ value: p.page, min: 1, max: Number.MAX_SAFE_INTEGER, fallback: 1 }),
        items: clampInt({ value: p.items, min: 1, max: 100, fallback: 20 }),
        order: p.order,
        date_filter: p.date_filter,
        from: toIso(p.from),
        to: toIso(p.to),
        participating_user_uuid: cleanList(p.participating_user_uuids),
        owner_uuid: cleanList(p.owner_uuids),
        customer_email_address: cleanList(p.customer_email_addresses),
        customer_phone_number: cleanList(p.customer_phone_numbers),
        conversation_type_uuid: p.conversation_type_uuid?.trim(),
        source: p.source?.trim(),
      },
    });
    return {
      calls: (response.data ?? []).map(slimCall),
      pagination: response.pagination,
    };
  },
});
