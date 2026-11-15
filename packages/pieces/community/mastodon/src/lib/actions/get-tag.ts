import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { MastodonEntity, mastodonClient } from '../common/client';
import { tagOutputSchema } from '../output-schemas';

export const getTag = createAction({
  auth: mastodonAuth,
  name: 'get_tag',
  classification: 'READ',
  displayName: 'Get Hashtag',
  description: 'Get information about a hashtag.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches a hashtag with its recent usage history and whether the connected account follows it. Use Get Hashtag Timeline for posts using it. Requires Mastodon 4.0 or later. Read-only and safe to retry.',
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
      method: HttpMethod.GET,
      path: `/api/v1/tags/${encodeURIComponent(context.propsValue.tag_name.replace(/^#/, ''))}`,
      operation: 'Get Hashtag',
      minVersion: '4.0.0',
    });
  },
});
