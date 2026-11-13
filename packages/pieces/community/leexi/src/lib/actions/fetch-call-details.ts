import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { leexiAuth } from '../common/auth';
import { LeexiApiError, leexiApi, LeexiAuthValue } from '../common/client';
import { LeexiCall } from '../common/types';
import {
  leexiOutputFields,
  MAX_FETCH_CALL_UUIDS,
  MAX_FETCH_CALL_UUIDS_WITH_INCLUDE,
} from '../common/constants';

const PER_CALL_STATUSES = [400, 404, 422];

function normalizeUuids(values: unknown[] | undefined): string[] {
  const seen = new Set<string>();
  for (const value of values ?? []) {
    if (typeof value !== 'string') {
      continue;
    }
    const trimmed = value.trim();
    if (trimmed !== '') {
      seen.add(trimmed);
    }
  }
  return [...seen];
}

function shapeCall({ call, include }: { call: LeexiCall; include: string[] }) {
  const base: Record<string, unknown> = {
    uuid: call.uuid,
    title: call.title ?? null,
    performed_at: call.performed_at ?? null,
    duration: call.duration ?? null,
    direction: call.direction ?? null,
    leexi_url: call.leexi_url ?? null,
    owner: call.owner ?? null,
    participating_users: call.participating_users ?? [],
    customers: call.customers ?? [],
    summary: call.summary ?? null,
    tasks: call.tasks ?? [],
  };
  if (include.includes('prompts')) {
    base['prompts'] = call.prompts ?? [];
  }
  if (include.includes('chapters')) {
    base['chapters'] = call.chapters ?? [];
  }
  if (include.includes('scorecards')) {
    base['scorecards'] = call.scorecards ?? [];
  }
  return base;
}

async function fetchCallDetails({
  auth,
  callUuids,
  include,
}: {
  auth: LeexiAuthValue;
  callUuids: unknown[] | undefined;
  include: string[];
}) {
  const uuids = normalizeUuids(callUuids);
  if (uuids.length === 0) {
    throw new Error('Provide at least one call UUID.');
  }
  if (uuids.length > MAX_FETCH_CALL_UUIDS) {
    throw new Error(`At most ${MAX_FETCH_CALL_UUIDS} call UUIDs can be fetched at once; got ${uuids.length}.`);
  }
  if (include.length > 0 && uuids.length > MAX_FETCH_CALL_UUIDS_WITH_INCLUDE) {
    throw new Error(
      `When "Include" is set, at most ${MAX_FETCH_CALL_UUIDS_WITH_INCLUDE} call UUIDs can be fetched at once; got ${uuids.length}.`,
    );
  }
  const results: FetchCallDetailsResult[] = [];
  for (const uuid of uuids) {
    try {
      const response = await leexiApi.request<{ data: LeexiCall }>({
        auth,
        method: HttpMethod.GET,
        path: ['calls', uuid],
      });
      results.push({ uuid, found: true, call: shapeCall({ call: response.data, include }) });
    } catch (error) {
      if (error instanceof LeexiApiError && PER_CALL_STATUSES.includes(error.status)) {
        results.push({ uuid, found: false, error: error.message });
        continue;
      }
      throw error;
    }
  }
  return {
    results,
    found_count: results.filter((r) => r.found).length,
    not_found_count: results.filter((r) => !r.found).length,
  };
}

export const fetchCallDetailsAction = createAction({
  name: 'fetch_call_details',
  classification: 'READ',
  auth: leexiAuth,
  displayName: 'Fetch Call Details',
  description: 'Get the AI summary, people and tasks of up to 20 Leexi calls.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches details for 1-20 Leexi calls by UUID (at most 5 when Include is set): title, performed_at, duration, direction, leexi_url, owner, participating users, customers, AI summary and follow-up tasks. Include can add AI notes (prompts), chapters and scorecards. Returns one entry per UUID with found=true and the call, or found=false with the error when that call does not exist, is outside the API key scope or has an invalid UUID (400/404/422). Any other failure (authentication, permission, rate limit, server error, network) fails the whole step so it can be retried. Get call UUIDs from Query Calls. Read-only.',
    idempotent: true,
  },
  outputSchema: {
    fields: [
      {
        key: 'results',
        label: 'Results',
        labelKey: 'uuid',
        listItems: [
          { key: 'uuid', label: 'Call UUID' },
          { key: 'found', label: 'Found', format: 'boolean' },
          { key: 'error', label: 'Error' },
          {
            key: 'call',
            label: 'Call',
            children: [
              ...leexiOutputFields.callSummary.filter((f) =>
                ['uuid', 'title', 'performed_at', 'duration', 'direction', 'leexi_url', 'owner', 'participating_users', 'customers'].includes(f.key),
              ),
              { key: 'summary', label: 'Summary' },
              { key: 'tasks', label: 'Tasks', listItems: leexiOutputFields.task, labelKey: 'subject' },
              { key: 'prompts', label: 'AI Notes (Prompts)' },
              { key: 'chapters', label: 'Chapters' },
              { key: 'scorecards', label: 'Scorecards' },
            ],
          },
        ],
      },
      { key: 'found_count', label: 'Found Count', format: 'number' },
      { key: 'not_found_count', label: 'Not Found Count', format: 'number' },
    ],
  },
  props: {
    call_uuids: Property.Array({
      displayName: 'Call UUIDs',
      description: 'Call UUIDs from Query Calls: 1-20, or up to 5 with Include.',
      required: true,
    }),
    include: Property.StaticMultiSelectDropdown({
      displayName: 'Include',
      description: 'Extra sections to return. Limits the request to 5 calls.',
      required: false,
      options: {
        options: [
          { label: 'AI Notes (prompts)', value: 'prompts' },
          { label: 'Chapters', value: 'chapters' },
          { label: 'Scorecards', value: 'scorecards' },
        ],
      },
    }),
  },
  async run(context) {
    return await fetchCallDetails({
      auth: context.auth,
      callUuids: context.propsValue.call_uuids,
      include: context.propsValue.include ?? [],
    });
  },
});

export const fetchCallDetailsInternals = { fetchCallDetails };

export type FetchCallDetailsResult =
  | { uuid: string; found: true; call: Record<string, unknown> }
  | { uuid: string; found: false; error: string };
