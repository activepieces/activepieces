import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostCreateChannelOutputSchema } from '../../../output-schemas';

export const createChannelAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_create_channel',
  outputSchema: mattermostCreateChannelOutputSchema,
  displayName: 'Create Channel',
  description: 'Creates a public or private channel in a team.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a public ("O") or private ("P") channel in a team; the connected user becomes its first member. For direct or group messages use Create Direct Channel or Create Group Message. Not idempotent: a taken name in the team fails.',
    idempotent: false,
  },
  props: {
    teamId: mattermostAiProps.teamId({ required: true }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Unique handle used in the channel URL: lowercase letters, numbers, "-" and "_", e.g. "release-notes".',
      required: true,
    }),
    displayName: Property.ShortText({
      displayName: 'Display Name',
      description: 'Channel name shown to users.',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Type',
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
    purpose: Property.ShortText({
      displayName: 'Purpose',
      description: 'Short description of what the channel is for.',
      required: false,
    }),
    header: Property.ShortText({
      displayName: 'Header',
      description: 'Markdown text shown in the channel header.',
      required: false,
    }),
  },
  async run(context) {
    const { teamId, name, displayName, type, purpose, header } = context.propsValue;
    if (type !== 'O' && type !== 'P') {
      throw new Error(`Type must be "O" or "P", got "${type}".`);
    }
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/channels',
      body: { team_id: teamId, name, display_name: displayName, type, purpose, header },
    });
  },
});
