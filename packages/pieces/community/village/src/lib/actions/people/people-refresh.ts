import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { villageAuth, VILLAGE_API_BASE_URL } from '../../common/auth';

export const peopleRefresh = createAction({
  auth: villageAuth,
  name: 'people_refresh',
  displayName: 'Refresh People',
  description:
    'Refresh or import people data from LinkedIn URLs. In realtime mode, returns enriched person data immediately (or times out after 25 seconds and converts to async). In async mode, returns job IDs for later status checking.',
  props: {
    linkedin_urls: Property.Array({
      displayName: 'LinkedIn URLs',
      description: 'LinkedIn profile URLs to refresh. At least one is required.',
      required: true,
      defaultValue: [],
    }),
    realtime: Property.Checkbox({
      displayName: 'Realtime',
      description:
        'If true, waits synchronously for results (up to 25s). If false, returns job IDs for async processing.',
      required: true,
    }),
  },
  async run(context) {
    const { linkedin_urls, realtime } = context.propsValue;

    if (!Array.isArray(linkedin_urls) || linkedin_urls.length === 0) {
      throw new Error('At least one LinkedIn URL is required.');
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${VILLAGE_API_BASE_URL}/v2/people/refresh`,
      headers: { Authorization: `Bearer ${context.auth.secret_text}` },
      body: {
        linkedin_urls: linkedin_urls.map(String),
        realtime,
      },
    });
    return response.body;
  },
});
