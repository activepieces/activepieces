import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { deepgramAuth } from '../common/auth';
import { DEEPGRAM_TIMEOUTS, deepgramClient } from '../common/client';
import { deepgramProjects } from '../common/projects';
import { deepgramProps } from '../common/props';
import { deepgramReports, RequestRow } from '../common/reports';
import { listRequestsOutputSchema } from '../output-schemas';

export const listRequestsAction = createAction({
  auth: deepgramAuth,
  name: 'list_requests',
  classification: 'SEARCH',
  displayName: 'List Requests',
  description:
    'Lists past API requests of a Deepgram project with status, duration and cost.',
  audience: 'human',
  aiMetadata: {
    description:
      'Lists past API requests of a Deepgram project, newest first, with status code, audio duration and cost in USD, filterable by date range, endpoint, method and success. Use to audit usage or find a request ID. Returns one page; has_more is true when the page is full, so ask for the next page number. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: listRequestsOutputSchema,
  props: {
    project: deepgramProps.project(),
    start: Property.DateTime({
      displayName: 'From',
      description: 'Only requests made at or after this time.',
      required: false,
    }),
    end: Property.DateTime({
      displayName: 'To',
      description: 'Only requests made at or before this time.',
      required: false,
    }),
    endpoint: Property.StaticDropdown({
      displayName: 'Endpoint',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Speech to text (listen)', value: 'listen' },
          { label: 'Text intelligence (read)', value: 'read' },
          { label: 'Text to speech (speak)', value: 'speak' },
          { label: 'Voice agent (agent)', value: 'agent' },
        ],
      },
    }),
    method: Property.StaticDropdown({
      displayName: 'Method',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Synchronous', value: 'sync' },
          { label: 'Callback (async)', value: 'async' },
          { label: 'Streaming', value: 'streaming' },
        ],
      },
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Succeeded', value: 'succeeded' },
          { label: 'Failed', value: 'failed' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Requests per page, from 1 to 1000. Defaults to 50.',
      required: false,
      defaultValue: 50,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number, starting at 0.',
      required: false,
      defaultValue: 0,
    }),
  },
  async run(context) {
    return listRequests({
      apiKey: context.auth.secret_text,
      input: context.propsValue,
    });
  },
});

export async function listRequests({
  apiKey,
  input,
}: {
  apiKey: string;
  input: ListRequestsInput;
}) {
  const { start, end, endpoint, method, status } = input;
  const limit = wholeNumber({
    value: input.limit,
    fallback: 50,
    min: 1,
    max: 1000,
    label: 'Limit',
  });
  const page = wholeNumber({
    value: input.page,
    fallback: 0,
    min: 0,
    max: Number.MAX_SAFE_INTEGER,
    label: 'Page',
  });
  const from = deepgramReports.toInstant(start);
  const to = deepgramReports.toInstant(end);
  deepgramReports.checkRange({ start: from, end: to });
  const projectId = await deepgramProjects.resolveProjectId({
    apiKey,
    project: input.project,
  });
  const response = await deepgramClient.request<RequestsResponse>({
    apiKey,
    method: HttpMethod.GET,
    path: deepgramProjects.projectPath({ projectId, rest: ['requests'] }),
    query: {
      start: from,
      end: to,
      endpoint: endpoint ?? undefined,
      method: method ?? undefined,
      status: status ?? undefined,
      limit,
      page,
    },
    timeoutMs: DEEPGRAM_TIMEOUTS.manage,
    operation: 'list requests',
  });
  const requests = (response.body?.requests ?? []).map((row) =>
    deepgramReports.flattenRequest(row)
  );
  return {
    requests,
    page,
    limit,
    has_more: requests.length === limit,
  };
}

function wholeNumber({
  value,
  fallback,
  min,
  max,
  label,
}: {
  value: unknown;
  fallback: number;
  min: number;
  max: number;
  label: string;
}): number {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(
      `${label} must be a whole number from ${min}${
        max === Number.MAX_SAFE_INTEGER ? ' up' : ` to ${max}`
      }.`
    );
  }
  return parsed;
}

type RequestsResponse = {
  page?: number;
  limit?: number;
  requests?: RequestRow[];
};

export type ListRequestsInput = {
  project?: string;
  start?: string;
  end?: string;
  endpoint?: string;
  method?: string;
  status?: string;
  limit?: number;
  page?: number;
};
