import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { deepgramAuth } from '../../common/auth';
import { usageFieldsOutputSchema } from '../../output-schemas';
import { DEEPGRAM_TIMEOUTS, deepgramClient } from '../../common/client';
import { deepgramProjects } from '../../common/projects';
import { deepgramProps } from '../../common/props';
import { UsageFieldsResponse, deepgramReports } from '../../common/reports';

export const listUsageFieldsAction = createAction({
  auth: deepgramAuth,
  name: 'deepgram_list_usage_fields',
  classification: 'SEARCH',
  displayName: 'List Usage Filter Values',
  description:
    'Lists the tags, model builds, methods and features used by a Deepgram project in a date range.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the tags, model builds (with model_id UUIDs), processing methods and features a Deepgram project actually used in a date range (YYYY-MM-DD). Use to find valid tag and model values for deepgram_get_usage_summary and deepgram_get_usage_breakdown; tags are returned without the tag= prefix. Read-only.',
    idempotent: true,
  },
  outputSchema: usageFieldsOutputSchema,
  props: {
    project_id: deepgramProps.projectId(),
    start: Property.DateTime({
      displayName: 'Start Date',
      description: 'First day to include.',
      required: false,
    }),
    end: Property.DateTime({
      displayName: 'End Date',
      description: 'Last day to include.',
      required: false,
    }),
  },
  async run(context) {
    const apiKey = context.auth.secret_text;
    const start = deepgramReports.toDay(context.propsValue.start);
    const end = deepgramReports.toDay(context.propsValue.end);
    deepgramReports.checkRange({ start, end });
    const projectId = await deepgramProjects.resolveProjectId({
      apiKey,
      project: context.propsValue.project_id,
    });
    const response = await deepgramClient.request<UsageFieldsResponse>({
      apiKey,
      method: HttpMethod.GET,
      path: deepgramProjects.projectPath({
        projectId,
        rest: ['usage', 'fields'],
      }),
      query: { start, end },
      timeoutMs: DEEPGRAM_TIMEOUTS.manage,
      operation: 'list the usage filter values',
    });
    return deepgramReports.flattenUsageFields(response.body ?? {});
  },
});
