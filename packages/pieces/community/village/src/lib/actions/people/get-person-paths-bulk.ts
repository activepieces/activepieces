import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { villageAuth, VILLAGE_API_BASE_URL } from '../../common/auth';

const MAX_BULK_LINKEDIN_IDS = 100;

export const getPersonPathsBulk = createAction({
  auth: villageAuth,
  name: 'get_person_paths_bulk',
  displayName: 'Get Person Paths (Bulk)',
  description:
    'Find introduction paths to multiple people in a single request. Provide up to 100 LinkedIn IDs (the slug after linkedin.com/in/) and get connection paths for each.',
  audience: 'both',
  aiMetadata: {
    description:
      'Read-only batch lookup of warm-introduction paths to many people at once, keyed by LinkedIn ID (the slug after linkedin.com/in/, not a full URL). Pick this over Get Person Paths when you have more than one target to evaluate together; capped at 100 IDs per call. Pure query, safe to retry.',
    idempotent: true,
  },
  props: {
    linkedin_ids: Property.Array({
      displayName: 'LinkedIn IDs',
      description:
        'LinkedIn identifiers (e.g. "johndoe" from linkedin.com/in/johndoe). Max 100 per request.',
      required: true,
      defaultValue: [],
    }),
  },
  async run(context) {
    const { linkedin_ids } = context.propsValue;

    if (!Array.isArray(linkedin_ids) || linkedin_ids.length === 0) {
      throw new Error('At least one LinkedIn ID is required.');
    }
    if (linkedin_ids.length > MAX_BULK_LINKEDIN_IDS) {
      throw new Error(`Maximum ${MAX_BULK_LINKEDIN_IDS} LinkedIn IDs per bulk request.`);
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${VILLAGE_API_BASE_URL}/v2/people/paths/bulk`,
      headers: { Authorization: `Bearer ${context.auth.secret_text}` },
      body: { linkedin_ids },
    });
    return response.body;
  },
});
