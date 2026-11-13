import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostArchiveChannelOutputSchema } from '../../../output-schemas';

export const updateChannelMemberRolesAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_update_channel_member_roles',
  outputSchema: mattermostArchiveChannelOutputSchema,
  displayName: 'Update Channel Member Role',
  description: 'Makes a channel member a channel admin or a regular member.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Promotes a channel member to channel admin or demotes them to a regular member. The user must already be in the channel (Add Channel Member). Needs the manage_channel_roles permission.',
    idempotent: true,
  },
  props: {
    channelId: mattermostAiProps.channelId({ required: true }),
    userId: mattermostAiProps.userId({ required: true }),
    role: Property.StaticDropdown({
      displayName: 'Role',
      description: '"admin" for channel admin, "member" for a regular channel member.',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Channel Admin', value: 'admin' },
          { label: 'Member', value: 'member' },
        ],
      },
    }),
  },
  async run(context) {
    const { channelId, userId, role } = context.propsValue;
    if (role !== 'admin' && role !== 'member') {
      throw new Error(`Role must be "admin" or "member", got "${role}".`);
    }
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: `/channels/${encodeURIComponent(channelId)}/members/${encodeURIComponent(userId)}/schemeRoles`,
      body: { scheme_admin: role === 'admin', scheme_user: true },
    });
  },
});
