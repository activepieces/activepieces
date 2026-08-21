import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { famulorAuth } from '../common/auth';
import { famulorRequest, flattenCall, unwrapList, unwrapTotal } from '../common/client';
import { assistantDropdown, campaignDropdown } from '../common/props';

export const listCalls = createAction({
  auth: famulorAuth,
  name: 'listCalls',
  displayName: 'List Calls',
  description: 'List recent calls, newest first, with optional filters.',
  classification: 'READ',
  audience: 'both',
  aiMetadata: {
    description:
      'List recent Famulor calls with optional assistant, campaign, status, direction, and time filters. Use this to browse many calls; use Get Call when you already have a UUID. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    assistant_id: assistantDropdown(false),
    campaign_id: campaignDropdown(false),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Only return calls with this status',
      required: false,
      options: {
        options: [
          { label: 'Queued', value: 'queued' },
          { label: 'Ringing', value: 'ringing' },
          { label: 'In progress', value: 'in_progress' },
          { label: 'Completed', value: 'completed' },
          { label: 'Failed', value: 'failed' },
          { label: 'No answer', value: 'no_answer' },
          { label: 'Busy', value: 'busy' },
        ],
      },
    }),
    direction: Property.StaticDropdown({
      displayName: 'Direction',
      description: 'Inbound, outbound, or web',
      required: false,
      options: {
        options: [
          { label: 'Inbound', value: 'inbound' },
          { label: 'Outbound', value: 'outbound' },
          { label: 'Web', value: 'web' },
        ],
      },
    }),
    q: Property.ShortText({
      displayName: 'Search',
      description: 'Optional text search across transcript and summary',
      required: false,
    }),
    from: Property.ShortText({
      displayName: 'From',
      description: 'Only calls created at or after this time (ISO 8601)',
      required: false,
    }),
    to: Property.ShortText({
      displayName: 'To',
      description: 'Only calls created at or before this time (ISO 8601)',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of calls to return (1–200, default 50)',
      required: false,
      defaultValue: 50,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of calls to skip for pagination',
      required: false,
      defaultValue: 0,
    }),
  },
  async run({ auth, propsValue }) {
    const queryParams: Record<string, string> = {};
    if (propsValue.assistant_id) {
      queryParams['assistant_id'] = String(propsValue.assistant_id);
    }
    if (propsValue.campaign_id) {
      queryParams['campaign_id'] = String(propsValue.campaign_id);
    }
    if (propsValue.status) {
      queryParams['status'] = String(propsValue.status);
    }
    if (propsValue.direction) {
      queryParams['direction'] = String(propsValue.direction);
    }
    if (propsValue.q?.trim()) {
      queryParams['q'] = propsValue.q.trim();
    }
    if (propsValue.from?.trim()) {
      queryParams['from'] = propsValue.from.trim();
    }
    if (propsValue.to?.trim()) {
      queryParams['to'] = propsValue.to.trim();
    }
    if (propsValue.limit !== undefined && propsValue.limit !== null) {
      queryParams['limit'] = String(propsValue.limit);
    }
    if (propsValue.offset !== undefined && propsValue.offset !== null) {
      queryParams['offset'] = String(propsValue.offset);
    }

    const body = await famulorRequest({
      auth,
      method: HttpMethod.GET,
      path: '/calls',
      queryParams,
    });

    const rows = unwrapList(body, ['calls', 'data', 'rows']).map((call) => flattenCall(call));
    return {
      total: unwrapTotal(body) ?? rows.length,
      rows,
    };
  },
});
