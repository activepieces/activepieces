import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostClient } from '../../../common/client';
import { mattermostCreateEmojiOutputSchema } from '../../../output-schemas';

export const getEmojiAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_get_emoji',
  outputSchema: mattermostCreateEmojiOutputSchema,
  displayName: 'Get Custom Emoji',
  description: 'Gets a custom emoji by ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one custom emoji (ID, name, creator) by its ID. Use Get Custom Emoji By Name when only the name is known.',
    idempotent: true,
  },
  props: {
    emojiId: Property.ShortText({
      displayName: 'Emoji ID',
      description: 'Custom emoji ID (26 characters). Use List Custom Emojis, Search Custom Emojis or Get Custom Emoji By Name to find it.',
      required: true,
    }),
  },
  async run(context) {
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/emoji/${encodeURIComponent(context.propsValue.emojiId)}`,
    });
  },
});
