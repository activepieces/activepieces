import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { MastodonEntity, mastodonClient } from '../common/client';
import { tagOutputSchema } from '../output-schemas';

export const unfollowTag = createAction({
  auth: mastodonAuth,
  name: 'unfollow_tag',
  classification: 'WRITE',
  displayName: 'Unfollow Hashtag',
  description: 'Stop following a hashtag.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Stops following a hashtag. Requires Mastodon 4.0 or later. Safe to retry. Returns the hashtag.',
    idempotent: true,
  },
  outputSchema: tagOutputSchema,
  props: {
    tag_name: Property.ShortText({
      displayName: 'Hashtag',
      description:
        'Hashtag name without the # sign, for example mastodon. A leading # is removed automatically.',
      required: true,
    }),
  },
  async run(context) {
    return mastodonClient.request<MastodonEntity>({
      auth: context.auth.props,
      method: HttpMethod.POST,
      path: `/api/v1/tags/${encodeURIComponent(context.propsValue.tag_name.replace(/^#/, ''))}/unfollow`,
      operation: 'Unfollow Hashtag',
      scope: 'write:follows',
      minVersion: '4.0.0',
    });
  },
});
