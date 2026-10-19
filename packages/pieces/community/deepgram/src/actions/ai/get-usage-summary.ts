import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { deepgramAuth } from '../../common/auth';
import { usageSummaryOutputSchema } from '../../output-schemas';
import { DEEPGRAM_TIMEOUTS, deepgramClient } from '../../common/client';
import { deepgramProjects } from '../../common/projects';
import { deepgramProps } from '../../common/props';
import { deepgramReports, UsageSummaryResponse } from '../../common/reports';

export const getUsageSummaryAction = createAction({
  auth: deepgramAuth,
  name: 'deepgram_get_usage_summary',
  classification: 'READ',
  displayName: 'Get Usage Summary',
  description:
    'Gets the usage summary of a Deepgram project for a date range, with optional filters.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the usage summary of a Deepgram project for a date range (YYYY-MM-DD), filterable by API key, tag, model build UUID, endpoint, method and deployment. Valid tag and model values come from deepgram_list_usage_fields; a model name such as nova-3 does not match. Returns per-day totals of audio hours, requests, text-to-speech characters and tokens plus overall totals; use deepgram_get_usage_breakdown to group by endpoint, model, tag or key. Read-only.',
    idempotent: true,
  },
  outputSchema: usageSummaryOutputSchema,
  props: {
    project_id: deepgramProps.projectId(),
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
    accessor: Property.ShortText({
      displayName: 'API Key ID',
      description: 'Only count requests made with this API key ID.',
      required: false,
    }),
    tag: Property.ShortText({
      displayName: 'Tag',
      description:
        'Only count requests with this tag, from deepgram_list_usage_fields.',
      required: false,
    }),
    model: Property.ShortText({
      displayName: 'Model UUID',
      description:
        'Only count requests to this model build, using a model_id from deepgram_list_usage_fields.',
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
    deployment: Property.StaticDropdown({
      displayName: 'Deployment',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Hosted', value: 'hosted' },
          { label: 'Beta', value: 'beta' },
          { label: 'Self-hosted', value: 'self-hosted' },
        ],
      },
    }),
  },
  async run(context) {
    const apiKey = context.auth.secret_text;
    const props = context.propsValue;
    const start = deepgramReports.toDay(props.start);
    const end = deepgramReports.toDay(props.end);
    deepgramReports.checkRange({ start, end });
    const projectId = await deepgramProjects.resolveProjectId({
      apiKey,
      project: props.project_id,
    });
    const tag = props.tag?.trim();
    const response = await deepgramClient.request<UsageSummaryResponse>({
      apiKey,
      method: HttpMethod.GET,
      path: deepgramProjects.projectPath({ projectId, rest: ['usage'] }),
      query: {
        start,
        end,
        accessor: props.accessor?.trim() || undefined,
        tag: tag ? deepgramReports.stripTagPrefix(tag) : undefined,
        model: props.model?.trim() || undefined,
        endpoint: props.endpoint ?? undefined,
        method: props.method ?? undefined,
        deployment: props.deployment ?? undefined,
      },
      timeoutMs: DEEPGRAM_TIMEOUTS.manage,
      operation: 'get the usage summary',
    });
    return deepgramReports.flattenUsageSummary(response.body ?? {});
  },
});
