import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { MastodonEntity, mastodonClient } from '../common/client';
import { instanceOutputSchema } from '../output-schemas';

export const getInstanceInfo = createAction({
  auth: mastodonAuth,
  name: 'get_instance_info',
  classification: 'READ',
  displayName: 'Get Instance Info',
  description: 'Get information about the connected Mastodon server.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns information about the connected Mastodon server: version, API versions, character limit, media and poll limits, registration and contact details. Use it to check limits before posting or to see whether a newer endpoint is supported. Requires Mastodon 4.0 or later. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: instanceOutputSchema,
  props: {
  },
  async run(context) {
    return mastodonClient.request<MastodonEntity>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: '/api/v2/instance',
      operation: 'Get Instance Info',
      minVersion: '4.0.0',
    });
  },
});
