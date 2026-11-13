import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetOrganizationTaskSummaryOutputSchema } from '../../../output-schemas';

export const getOrganizationTaskSummaryAction = createAction({
  auth: podioAuth,
  name: 'podio_get_organization_task_summary',
  outputSchema: podioGetOrganizationTaskSummaryOutputSchema,
  displayName: 'Get Organization Task Summary',
  description: 'Summarizes the open tasks in an organization by due date.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Summarizes the tasks of the connected user in one Podio organization: returns the open tasks grouped into overdue, due today and other, each group with its total and up to Limit tasks. The org id comes from List Organizations.',
    idempotent: true,
  },
  props: {
    orgId: podioAiProps.id({ required: true, displayName: 'Organization ID', description: 'The id of the organization.' }),
    limit: podioAiProps.limit({ required: false, description: 'Maximum number of tasks to return in each group. Defaults to 4.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.GET,
      path: `/task/org/${propsValue.orgId}/summary`,
      query: podioUtils.query({ values: { limit: propsValue.limit } }),
    });
  },
});
