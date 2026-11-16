import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { pocketbaseAuth } from '../../../auth';
import { pocketbaseClient } from '../../../common/client';
import { pocketbaseSettingsOutputSchema } from '../../../output-schemas';

export const getSettingsAction = createAction({
  auth: pocketbaseAuth,
  name: 'pocketbase_get_settings',
  outputSchema: pocketbaseSettingsOutputSchema,
  displayName: 'Get Settings',
  description: 'Gets the instance settings.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns the instance settings: app meta, SMTP, S3 storage, backups schedule, logs retention, batch API, rate limits and trusted proxy. Secrets such as the SMTP password come back masked.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    return await pocketbaseClient.request({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/api/settings',
    });
  },
});
