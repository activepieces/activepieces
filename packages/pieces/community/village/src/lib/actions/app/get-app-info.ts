import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../common/auth';
import { villageApi } from '../../common/client';
import { villageSchemas } from '../../common/schemas';

export const getAppInfo = createAction({
  auth: villageAuth,
  name: 'get_app_info',
  classification: 'READ',
  displayName: 'Get App Information',
  description:
    'Get information about the partner application associated with your token — title, description, domain, logo URL, public key, and active flag. Useful for verifying your app configuration.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetch metadata about the partner application tied to the current API token (title, domain, public key, active flag). Read-only and idempotent. Use to verify which app a token belongs to and confirm its configuration, not for user or team data.',
    idempotent: true,
  },
  outputSchema: villageSchemas.getAppInfo,
  props: {},
  async run(context) {
    const response = await villageApi.call({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/v2/app`,
    });
    return response;
  },
});
