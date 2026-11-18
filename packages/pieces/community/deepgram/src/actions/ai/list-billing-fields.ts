import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { deepgramAuth } from '../../common/auth';
import { billingFieldsOutputSchema } from '../../output-schemas';
import { DEEPGRAM_TIMEOUTS, deepgramClient } from '../../common/client';
import { deepgramProjects } from '../../common/projects';
import { deepgramProps } from '../../common/props';
import { BillingFieldsResponse, deepgramReports } from '../../common/reports';

export const listBillingFieldsAction = createAction({
  auth: deepgramAuth,
  name: 'deepgram_list_billing_fields',
  classification: 'SEARCH',
  displayName: 'List Billing Filter Values',
  description:
    'Lists the API keys, deployments, tags and line items billed to a Deepgram project in a date range.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the API key IDs, deployments, tags and line items (with descriptions) billed to a Deepgram project in a date range (YYYY-MM-DD). Use to find valid line items and tags for deepgram_get_billing_breakdown. Needs an admin or owner key. Read-only.',
    idempotent: true,
  },
  outputSchema: billingFieldsOutputSchema,
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
    const response = await deepgramClient.request<BillingFieldsResponse>({
      apiKey,
      method: HttpMethod.GET,
      path: deepgramProjects.projectPath({
        projectId,
        rest: ['billing', 'fields'],
      }),
      query: { start, end },
      timeoutMs: DEEPGRAM_TIMEOUTS.manage,
      operation: 'list the billing filter values',
    });
    return deepgramReports.flattenBillingFields(response.body ?? {});
  },
});
