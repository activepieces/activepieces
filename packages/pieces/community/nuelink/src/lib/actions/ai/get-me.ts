import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { nuelinkAuths } from '../../auth';
import { nuelinkOutputSchemas } from '../../output-schemas';
import { nuelinkClient } from '../../common/client';

export const aiGetMe = createAction({
  name: 'nuelink_get_me',
  classification: 'READ',
  auth: nuelinkAuths,
  displayName: 'Get Profile',
  description: 'Returns the Nuelink user the API key belongs to.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the user the API key acts as (opaque id, name, joinedAt, timezone), to confirm whose account is in use. The user timezone may be null or an internal UUID: never use it for scheduling; scheduled times use the brand timezone from nuelink_list_brands. Read-only.',
    idempotent: true,
  },
  props: {},
  outputSchema: nuelinkOutputSchemas.profile,
  async run(context) {
    const apiKey = nuelinkClient.apiKeyOf({ auth: context.auth });
    return nuelinkClient.request({ apiKey, method: HttpMethod.GET, path: ['me'] });
  },
});
