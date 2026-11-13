import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioSearchGloballyWithStatusesOutputSchema } from '../../../output-schemas';

export const searchInOrganizationWithStatusesAction = createAction({
  auth: podioAuth,
  name: 'podio_search_in_organization_with_statuses',
  outputSchema: podioSearchGloballyWithStatusesOutputSchema,
  displayName: 'Search In Organization With Statuses',
  description: 'Searches an organization, with statuses as a searchable type.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Searches the items, statuses and non-private tasks of one Podio organization, up to 20 per call. This is the older search; it exists because it accepts the object type "status", which the v2 search actions do not. Prefer Search In Organization otherwise. The organization id comes from List Organizations.',
    idempotent: true,
  },
  props: {
    orgId: podioAiProps.id({ required: true, displayName: 'Organization ID', description: 'The id of the organization, from List Organizations.' }),
    query: podioAiProps.text({ required: true, displayName: 'Query', description: 'The text to search for.' }),
    limit: podioAiProps.limit({ required: false, description: 'Maximum number of results to return, up to 20. Defaults to 20.' }),
    offset: podioAiProps.offset({ required: false }),
    refType: podioAiProps.choice({ required: false, displayName: 'Object Type', description: 'Only results of this type; "status" is accepted here and not by the v2 search actions.', values: ['item', 'status', 'task', 'file', 'conversation', 'profile', 'app'] }),
    searchFields: podioAiProps.text({ required: false, displayName: 'Search Fields', description: 'Comma-separated fields to search in, such as "title". Defaults to all fields.' }),
  },
  async run({ auth, propsValue }) {
    const body = await podioClient.request<unknown[]>({
      auth,
      method: HttpMethod.POST,
      path: `/search/org/${propsValue.orgId}/`,
      query: podioUtils.query({ values: { search_fields: propsValue.searchFields } }),
      body: podioUtils.body({
        values: {
          query: propsValue.query,
          limit: Math.min(propsValue.limit ?? 20, 20),
          offset: propsValue.offset,
          ref_type: propsValue.refType,
        },
      }),
    });
    return { results: body, count: body.length };
  },
});
