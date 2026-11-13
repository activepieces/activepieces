import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pocketbaseAuth } from '../../../auth';
import { pocketbaseClient } from '../../../common/client';
import { pocketbaseSettingsOutputSchema } from '../../../output-schemas';

export const updateSettingsAction = createAction({
  auth: pocketbaseAuth,
  name: 'pocketbase_update_settings',
  outputSchema: pocketbaseSettingsOutputSchema,
  displayName: 'Update Settings',
  description: 'Changes instance settings.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Changes instance settings and returns them. Send only the sections and keys to change; the rest stay as they are, except arrays such as rateLimits.rules, which are replaced whole. Read the current values with Get Settings first.',
    idempotent: true,
  },
  props: {
    settings: Property.Json({
      displayName: 'Settings',
      description: 'Partial settings object, e.g. { "batch": { "enabled": true, "maxRequests": 50, "timeout": 3 } } or { "logs": { "maxDays": 7 } }. Sections: meta, logs, backups, smtp, s3, batch, rateLimits, trustedProxy.',
      required: true,
    }),
  },
  async run(context) {
    return await pocketbaseClient.request({
      auth: context.auth,
      method: HttpMethod.PATCH,
      path: '/api/settings',
      body: context.propsValue.settings,
    });
  },
});
