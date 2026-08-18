import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { tokportalAuth } from '../auth';
import { tokportalApiCall } from '../common/client';
import { tokportalProps } from '../common/props';

export const publishAllBundleVideos = createAction({
  auth: tokportalAuth,
  name: 'publish_all_bundle_videos',
  displayName: 'Publish All Bundle Videos',
  description:
    'Publishes every configured-but-unpublished video slot of an active bundle so the account manager can post them.',
  audience: 'both',
  aiMetadata: {
    description:
      'Publish all configured video slots of an accepted TokPortal bundle at once, after Configure Video. Returns the number of videos published; slots already published are skipped, so retries are safe.',
    idempotent: true,
  },
  props: {
    bundleId: tokportalProps.bundleId(true),
  },
  async run(context) {
    const response = await tokportalApiCall<{ data: Record<string, unknown> }>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      resourceUri: `/bundles/${context.propsValue.bundleId}/videos/publish-all`,
    });
    return response.data ?? response;
  },
});
