import { apolloAuth } from '../../';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import {
  Property,
  StoreScope,
  createAction,
} from '@activepieces/pieces-framework';

export const organizationJobPostings = createAction({
  auth: apolloAuth,
  name: 'organizationJobPostings',
  displayName: 'Organization Job Postings',
  description: 'Retrieve current job postings for a company to identify growing headcount areas',
  props: {
    organization_id: Property.ShortText({
      displayName: 'Organization ID',
      description: 'The Apollo ID of the organization to get job postings for',
      required: true,
    }),
    cacheResponse: Property.Checkbox({
      displayName: 'Cache Response',
      description: 'Store the response in the project store for future use.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ propsValue, auth, store }) {
    const cacheKey = `_apollo_job_postings_${propsValue.organization_id}`;

    if (propsValue.cacheResponse) {
      const cachedResult = await store.get(cacheKey, StoreScope.PROJECT);
      if (cachedResult) {
        return cachedResult;
      }
    }

    const result = await httpClient.sendRequest<{
      organization_job_postings: Record<string, unknown>[];
      pagination: Record<string, unknown>;
    }>({
      method: HttpMethod.GET,
      url: `https://api.apollo.io/api/v1/organizations/${propsValue.organization_id}/job_postings`,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
         'x-api-key': `${auth.secret_text}`,
      },
    });

    

    if (propsValue.cacheResponse) {
      await store.put(cacheKey, result.body.organization_job_postings || [], StoreScope.PROJECT);
    }

    return result.body.organization_job_postings || [];
  },
});
