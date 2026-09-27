import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { MastodonEntity, mastodonClient } from '../common/client';
import { tagOutputSchema } from '../output-schemas';

export const followTag = createAction({
  auth: mastodonAuth,
  name: 'follow_tag',
  classification: 'WRITE',
  displayName: 'Follow Hashtag',
  description: 'Follow a hashtag so its posts appear in your home timeline.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Follows a hashtag so posts using it appear in the connected account\'s home timeline. Requires Mastodon 4.0 or later; repeating it is harmless on 4.1 and later. Returns the hashtag.',
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
      path: `/api/v1/tags/${encodeURIComponent(context.propsValue.tag_name.replace(/^#/, ''))}/follow`,
      operation: 'Follow Hashtag',
      scope: 'write:follows',
      minVersion: '4.0.0',
    });
  },
});
