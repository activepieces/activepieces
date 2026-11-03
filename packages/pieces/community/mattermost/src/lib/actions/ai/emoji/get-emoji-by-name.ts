import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostClient } from '../../../common/client';
import { mattermostCreateEmojiOutputSchema } from '../../../output-schemas';

export const getEmojiByNameAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_get_emoji_by_name',
  outputSchema: mattermostCreateEmojiOutputSchema,
  displayName: 'Get Custom Emoji By Name',
  description: 'Gets a custom emoji by its name.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one custom emoji (ID, name, creator) by its exact name. Built-in emoji like "thumbsup" are not found. Use Get Custom Emojis By Names for several at once.',
    idempotent: true,
  },
  props: {
    emojiName: Property.ShortText({
      displayName: 'Emoji Name',
      description: 'Exact custom emoji name without colons, e.g. "party_parrot".',
      required: true,
    }),
  },
  async run(context) {
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/emoji/name/${encodeURIComponent(context.propsValue.emojiName)}`,
    });
  },
});
