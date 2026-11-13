import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostClient } from '../../../common/client';
import { mattermostArchiveChannelOutputSchema } from '../../../output-schemas';

export const deleteEmojiAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_delete_emoji',
  outputSchema: mattermostArchiveChannelOutputSchema,
  displayName: 'Delete Custom Emoji',
  description: 'Deletes a custom emoji.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes a custom emoji; existing reactions with it stop rendering. Needs to be the emoji\'s creator or have manage_team / manage_system permission. Not idempotent: a second call fails because the emoji is gone.',
    idempotent: false,
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
      method: HttpMethod.DELETE,
      path: `/emoji/${encodeURIComponent(context.propsValue.emojiId)}`,
    });
  },
});
