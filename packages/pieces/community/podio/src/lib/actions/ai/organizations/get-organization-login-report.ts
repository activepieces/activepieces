import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetOrganizationLoginReportOutputSchema } from '../../../output-schemas';

export const getOrganizationLoginReportAction = createAction({
  auth: podioAuth,
  name: 'podio_get_organization_login_report',
  outputSchema: podioGetOrganizationLoginReportOutputSchema,
  displayName: 'Get Organization Login Report',
  description: 'Gets the weekly total and active user counts of an organization.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists, per week counting back from last week, the total number of users in an organization and how many logged in. Requires organization admin rights. The organization id comes from List Organizations.',
    idempotent: true,
  },
  props: {
    orgId: podioAiProps.id({ required: true, displayName: 'Organization ID', description: 'The id of the organization, from List Organizations.' }),
    limit: podioAiProps.limit({ required: false, description: 'Number of weeks to return, at most 16. Defaults to 4.' }),
    offset: podioAiProps.offset({ required: false }),
  },
  async run({ auth, propsValue }) {
    const query = podioUtils.query({ values: { limit: Math.min(propsValue.limit ?? 4, 16), offset: propsValue.offset } });
    const body = await podioClient.request<unknown[]>({ auth, method: HttpMethod.GET, path: `/org/${propsValue.orgId}/report/login/`, query });
    return { weeks: body, count: body.length };
  },
});
