import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, QueryParams } from '@activepieces/pieces-common';
import { bolnaaiAuth } from '../common/auth';
import { bolnaClient } from '../common/client';
import { agentId } from '../common/props';
import { bolnaSchemas } from '../common/schemas';

const MAX_RANGE_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_PAGE_SIZE = 50;
const DEFAULT_PAGE_SIZE = 20;

const STATUSES = [
  'scheduled',
  'queued',
  'rescheduled',
  'ringing',
  'initiated',
  'in-progress',
  'call-disconnected',
  'completed',
  'balance-low',
  'busy',
  'no-answer',
  'canceled',
  'failed',
  'stopped',
  'error',
];

export const listAgentExecutions = createAction({
  auth: bolnaaiAuth,
  name: 'list_agent_executions',
  displayName: 'List Agent Executions',
  description:
    'List the calls made or received by a Bolna agent in a date range.',
  audience: 'ai',
  classification: 'SEARCH',
  outputSchema: {
    fields: [
      { key: 'page_number', label: 'Page Number', format: 'number' },
      { key: 'page_size', label: 'Page Size', format: 'number' },
      { key: 'total', label: 'Total', format: 'number' },
      { key: 'has_more', label: 'Has More', format: 'boolean' },
      {
        key: 'data',
        label: 'Executions',
        labelKey: 'id',
        listItems: bolnaSchemas.executionFields,
      },
    ],
  },
  aiMetadata: {
    description:
      'Lists call executions of one Bolna agent created within a date range of at most 7 days (defaults to the last 7 days), newest data paged with page_number and page_size (max 50). Optionally filter by status or call type. When has_more is true, call again with the next page_number. Use List Agents to find the agent ID.',
    idempotent: true,
  },
  props: {
    agentId,
    from: Property.DateTime({
      displayName: 'From',
      description:
        'Start of the range (UTC). Defaults to 7 days before "To". The range cannot exceed 7 days.',
      required: false,
    }),
    to: Property.DateTime({
      displayName: 'To',
      description:
        'End of the range (UTC). Defaults to now, or 7 days after "From" when only "From" is set.',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Only return executions with this status.',
      required: false,
      options: {
        disabled: false,
        options: STATUSES.map((status) => ({ label: status, value: status })),
      },
    }),
    callType: Property.StaticDropdown({
      displayName: 'Call Type',
      description: 'Only return inbound or outbound calls.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Inbound', value: 'inbound' },
          { label: 'Outbound', value: 'outbound' },
        ],
      },
    }),
    pageNumber: Property.Number({
      displayName: 'Page Number',
      description: 'Page to return, starting at 1.',
      required: false,
      defaultValue: 1,
    }),
    pageSize: Property.Number({
      displayName: 'Page Size',
      description: 'Executions per page (1-50). Defaults to 20.',
      required: false,
      defaultValue: DEFAULT_PAGE_SIZE,
    }),
  },
  async run(context) {
    const { from, to, status, callType, pageNumber, pageSize } =
      context.propsValue;
    const { fromDate, toDate } = resolveRange({ from, to });
    const page = pageNumber ?? 1;
    const size = pageSize ?? DEFAULT_PAGE_SIZE;
    if (!Number.isInteger(page) || page < 1) {
      throw new Error('Page Number must be a whole number of 1 or more.');
    }
    if (!Number.isInteger(size) || size < 1 || size > MAX_PAGE_SIZE) {
      throw new Error(
        `Page Size must be a whole number between 1 and ${MAX_PAGE_SIZE}.`
      );
    }
    const queryParams: QueryParams = {
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
      page_number: String(page),
      page_size: String(size),
    };
    if (status) {
      queryParams['status'] = status;
    }
    if (callType) {
      queryParams['call_type'] = callType;
    }
    const response = await bolnaClient.makeRequest<unknown>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/v2/agent/${encodeURIComponent(
        context.propsValue.agentId
      )}/executions`,
      queryParams,
    });
    const record = bolnaSchemas.isRecord(response) ? response : {};
    return {
      page_number: record['page_number'] ?? page,
      page_size: record['page_size'] ?? size,
      total: record['total'] ?? null,
      has_more: record['has_more'] ?? false,
      data: bolnaSchemas.asArray(record['data']),
    };
  },
});

function parseDate({ value, label }: { value: string; label: string }): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${label} is not a valid date: ${value}`);
  }
  return date;
}

function resolveRange({
  from,
  to,
}: {
  from: string | undefined;
  to: string | undefined;
}): { fromDate: Date; toDate: Date } {
  const fromInput = from ? parseDate({ value: from, label: 'From' }) : null;
  const toDate = to
    ? parseDate({ value: to, label: 'To' })
    : fromInput
    ? new Date(Math.min(Date.now(), fromInput.getTime() + MAX_RANGE_MS))
    : new Date();
  const fromDate = fromInput ?? new Date(toDate.getTime() - MAX_RANGE_MS);
  if (fromDate.getTime() > toDate.getTime()) {
    throw new Error('"From" must be before "To".');
  }
  if (toDate.getTime() - fromDate.getTime() > MAX_RANGE_MS) {
    throw new Error(
      'The date range cannot exceed 7 days. Narrow "From" and "To".'
    );
  }
  return { fromDate, toDate };
}
