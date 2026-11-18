import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { deepgramAuth } from '../common/auth';
import { DEEPGRAM_TIMEOUTS, deepgramClient } from '../common/client';
import { deepgramProjects } from '../common/projects';
import { deepgramProps } from '../common/props';
import { deepgramReports, UsageBreakdownResponse } from '../common/reports';
import { usageOutputSchema } from '../output-schemas';

export const getUsageAction = createAction({
  auth: deepgramAuth,
  name: 'get_usage',
  classification: 'READ',
  displayName: 'Get Usage Breakdown',
  description:
    'Gets audio hours, requests, characters and tokens used by a Deepgram project, optionally grouped.',
  audience: 'human',
  aiMetadata: {
    description:
      'Returns usage totals of a Deepgram project for a date range (audio hours, requests, text-to-speech characters, tokens), split per day or grouped by endpoint, model, method, tag, key, feature set or deployment. Use for usage reports; use deepgram_get_billing_breakdown for dollars. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: usageOutputSchema,
  props: {
    project: deepgramProps.project(),
    start: Property.DateTime({
      displayName: 'Start Date',
      description: 'First day to include. Deepgram defaults to 30 days ago.',
      required: false,
    }),
    end: Property.DateTime({
      displayName: 'End Date',
      description: 'Last day to include. Deepgram defaults to today.',
      required: false,
    }),
    groupBy: Property.StaticDropdown({
      displayName: 'Group By',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Endpoint', value: 'endpoint' },
          { label: 'Model', value: 'models' },
          { label: 'Method', value: 'method' },
          { label: 'Tag', value: 'tags' },
          { label: 'API key (accessor)', value: 'accessor' },
          { label: 'Feature set', value: 'feature_set' },
          { label: 'Deployment', value: 'deployment' },
        ],
      },
    }),
    endpoint: Property.StaticDropdown({
      displayName: 'Endpoint',
      description: 'Only count requests to this endpoint.',
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
    tag: Property.ShortText({
      displayName: 'Tag',
      description: 'Only count requests sent with this tag.',
      required: false,
    }),
  },
  async run(context) {
    return getUsageBreakdown({
      apiKey: context.auth.secret_text,
      input: context.propsValue,
    });
  },
});

export async function getUsageBreakdown({
  apiKey,
  input,
}: {
  apiKey: string;
  input: UsageBreakdownInput;
}) {
  const { groupBy, endpoint, tag } = input;
  const start = deepgramReports.toDay(input.start);
  const end = deepgramReports.toDay(input.end);
  deepgramReports.checkRange({ start, end });
  const projectId = await deepgramProjects.resolveProjectId({
    apiKey,
    project: input.project,
  });
  const response = await deepgramClient.request<UsageBreakdownResponse>({
    apiKey,
    method: HttpMethod.GET,
    path: deepgramProjects.projectPath({
      projectId,
      rest: ['usage', 'breakdown'],
    }),
    query: {
      start,
      end,
      grouping: groupBy ?? undefined,
      endpoint: endpoint ?? undefined,
      tag: tag?.trim() || undefined,
    },
    timeoutMs: DEEPGRAM_TIMEOUTS.manage,
    operation: 'get usage',
  });
  return deepgramReports.flattenUsage(response.body ?? {});
}

export type UsageBreakdownInput = {
  project?: string;
  start?: string;
  end?: string;
  groupBy?: string;
  endpoint?: string;
  tag?: string;
};
