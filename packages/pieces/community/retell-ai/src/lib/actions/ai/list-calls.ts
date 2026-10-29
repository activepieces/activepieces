import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { retellAiProps } from '../../common/ai-props';
import { retellAiAuth } from '../../common/auth';
import { apiKeyOf, retellApiCall } from '../../common/client';
import { retellInput } from '../../common/input';
import { retellOptions } from '../../common/options';
import { retellMap } from '../../common/mappers';
import { retellSchemas } from '../../common/schemas';
export const listCallsAction = createAction({
  auth: retellAiAuth,
  name: 'list_calls',
  classification: 'SEARCH',
  displayName: 'List Calls',
  description: 'Lists calls newest first with optional filters.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists Retell calls newest first, one page at a time, filtered by agent, status, direction, call type, numbers or start time. Items have no transcript or recording; use Get Call by ID for those. Pass pagination_key to read the next page. Read-only.',
    idempotent: true,
  },
  props: {
    agent_id: retellAiProps.id({ displayName: 'Agent ID', description: 'Optional agent ID to only list its calls.', required: false }),
    call_status: Property.ShortText({
      displayName: 'Call Statuses',
      description: `Optional comma-separated statuses: ${retellOptions.CALL_STATUSES.join(', ')}.`,
      required: false,
    }),
    direction: Property.StaticDropdown({
      displayName: 'Direction',
      required: false,
      options: { options: [{ label: 'Inbound', value: 'inbound' }, { label: 'Outbound', value: 'outbound' }] },
    }),
    call_type: Property.StaticDropdown({
      displayName: 'Call Type',
      required: false,
      options: { options: [{ label: 'Phone Call', value: 'phone_call' }, { label: 'Web Call', value: 'web_call' }] },
    }),
    from_number: retellAiProps.e164Number({ displayName: 'From Number', description: 'Optional caller number.', required: false }),
    to_number: retellAiProps.e164Number({ displayName: 'To Number', description: 'Optional called number.', required: false }),
    started_after: Property.ShortText({
      displayName: 'Started After',
      description: 'Optional ISO date or Unix time; calls that started at or after it.',
      required: false,
    }),
    started_before: Property.ShortText({
      displayName: 'Started Before',
      description: 'Optional ISO date or Unix time; calls that started at or before it.',
      required: false,
    }),
    limit: retellAiProps.limit(),
    pagination_key: retellAiProps.paginationKey(),
  },
  outputSchema: retellSchemas.callPage,
  async run({ auth, propsValue }) {
    const filter: Record<string, unknown> = {};
    const agentId = retellInput.optionalText(propsValue.agent_id);
    if (agentId !== undefined) {
      filter['agent'] = [{ agent_id: agentId }];
    }
    const status = retellInput.enumFilter({ value: propsValue.call_status, label: 'Call Statuses', allowed: retellOptions.CALL_STATUSES });
    if (status !== undefined) {
      filter['call_status'] = status;
    }
    const direction = retellInput.optionalText(propsValue.direction);
    if (direction !== undefined) {
      filter['direction'] = { type: 'enum', op: 'in', value: [direction] };
    }
    const callType = retellInput.optionalText(propsValue.call_type);
    if (callType !== undefined) {
      filter['call_type'] = { type: 'enum', op: 'in', value: [callType] };
    }
    const fromNumber = retellInput.optionalE164({ value: propsValue.from_number, label: 'From Number' });
    if (fromNumber !== undefined) {
      filter['from_number'] = retellInput.stringFilter(fromNumber);
    }
    const toNumber = retellInput.optionalE164({ value: propsValue.to_number, label: 'To Number' });
    if (toNumber !== undefined) {
      filter['to_number'] = retellInput.stringFilter(toNumber);
    }
    const after = retellInput.timestampMs({ value: propsValue.started_after, label: 'Started After' });
    const before = retellInput.timestampMs({ value: propsValue.started_before, label: 'Started Before' });
    if (after !== undefined && before !== undefined) {
      if (after > before) {
        throw new Error('Started After must be earlier than Started Before.');
      }
      filter['start_timestamp'] = { type: 'range', op: 'bt', value: [after, before] };
    } else if (after !== undefined) {
      filter['start_timestamp'] = { type: 'number', op: 'ge', value: after };
    } else if (before !== undefined) {
      filter['start_timestamp'] = { type: 'number', op: 'le', value: before };
    }
    const body: Record<string, unknown> = {
      sort_order: 'descending',
      limit: retellInput.pageLimit(propsValue.limit),
    };
    if (Object.keys(filter).length > 0) {
      body['filter_criteria'] = filter;
    }
    const paginationKey = retellInput.optionalText(propsValue.pagination_key);
    if (paginationKey !== undefined) {
      body['pagination_key'] = paginationKey;
    }
    const response = await retellApiCall({
      apiKey: apiKeyOf(auth),
      method: HttpMethod.POST,
      path: '/v3/list-calls',
      body,
      retryRateLimit: true,
    });
    return retellMap.page({ body: response, mapItem: retellMap.call });
  },
});

