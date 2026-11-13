import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostCreateChannelOutputSchema } from '../../../output-schemas';

export const updateChannelPrivacyAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_update_channel_privacy',
  outputSchema: mattermostCreateChannelOutputSchema,
  displayName: 'Update Channel Privacy',
  description: 'Converts a channel between public and private.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Makes a channel public ("O") or private ("P"). Converting to private hides it from non-members; converting back makes its history visible to the whole team. Direct and group messages cannot be converted.',
    idempotent: true,
  },
  props: {
    channelId: mattermostAiProps.channelId({ required: true }),
    privacy: Property.StaticDropdown({
      displayName: 'Privacy',
      description: '"O" for a public channel, "P" for a private channel.',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Public', value: 'O' },
          { label: 'Private', value: 'P' },
        ],
      },
    }),
  },
  async run(context) {
    const { channelId, privacy } = context.propsValue;
    if (privacy !== 'O' && privacy !== 'P') {
      throw new Error(`Privacy must be "O" or "P", got "${privacy}".`);
    }
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: `/channels/${encodeURIComponent(channelId)}/privacy`,
      body: { privacy },
    });
  },
});
