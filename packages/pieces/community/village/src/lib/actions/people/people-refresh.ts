import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../common/auth';
import { villageApi } from '../../common/client';
import { villageSchemas } from '../../common/schemas';

export const peopleRefresh = createAction({
  auth: villageAuth,
  name: 'people_refresh',
  classification: 'WRITE',
  displayName: 'Refresh People',
  description:
    'Refresh or import people data from LinkedIn URLs. In realtime mode, returns enriched person data immediately (or times out after 25 seconds and converts to async). In async mode, returns job IDs for later status checking.',
  audience: 'both',
  aiMetadata: {
    description:
      'Trigger a re-fetch or first-time import of people into your network from LinkedIn URLs; this kicks off backend processing, so treat it as a non-idempotent write rather than a plain read. Set realtime=true to wait up to ~25s for enriched data inline, or false to get job IDs to poll later. To read already-imported profiles without re-fetching, use Enrich Person instead.',
    idempotent: false,
  },
  outputSchema: villageSchemas.refreshJobs,
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

    const response = await villageApi.call({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/v2/people/refresh`,
      body: {
        linkedin_urls: linkedin_urls.map(String),
        realtime,
      },
    });
    return response;
  },
});
