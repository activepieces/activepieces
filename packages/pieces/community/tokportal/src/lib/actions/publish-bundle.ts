import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { tokportalAuth } from '../auth';
import { tokportalApiCall } from '../common/client';
import { tokportalProps } from '../common/props';

export const publishBundle = createAction({
  auth: tokportalAuth,
  name: 'publish_bundle',
  displayName: 'Publish Bundle',
  description:
    'Publishes a fully configured bundle to the account managers marketplace so a manager can pick it up.',
  audience: 'both',
  aiMetadata: {
    description:
      'Publish a configured TokPortal bundle so an account manager can accept it. Fails with 409 and a list of blockers when the account or videos are not configured yet. Publishing an already published bundle is rejected, so retries are safe.',
    idempotent: true,
  },
  props: {
    bundleId: tokportalProps.bundleId(true),
  },
  async run(context) {
    return await tokportalApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      resourceUri: `/bundles/${context.propsValue.bundleId}/publish`,
    });
  },
});
