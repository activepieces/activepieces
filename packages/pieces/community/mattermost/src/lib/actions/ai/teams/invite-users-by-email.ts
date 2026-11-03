import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostArchiveChannelOutputSchema } from '../../../output-schemas';

export const inviteUsersByEmailAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_invite_users_by_email',
  outputSchema: mattermostArchiveChannelOutputSchema,
  displayName: 'Invite Users By Email',
  description: 'Emails team invitations to a list of addresses.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Sends a team invitation email to each address. Only works when the server has email invitations enabled and SMTP configured; the server allows about 20 invitation emails per hour. Needs the invite_user and add_user_to_team permissions. Not idempotent: each call sends new emails.',
    idempotent: false,
  },
  props: {
    teamId: mattermostAiProps.teamId({ required: true }),
    emails: Property.Array({
      displayName: 'Emails',
      description: 'Email addresses to invite.',
      required: true,
    }),
  },
  async run(context) {
    const { teamId, emails } = context.propsValue;
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/teams/${encodeURIComponent(teamId)}/invite/email`,
      body: emails,
    });
  },
});
