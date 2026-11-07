import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostClient } from '../../../common/client';
import { mattermostGetTeamInviteInfoOutputSchema } from '../../../output-schemas';

export const getTeamInviteInfoAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_get_team_invite_info',
  outputSchema: mattermostGetTeamInviteInfoOutputSchema,
  displayName: 'Get Team Invite Info',
  description: 'Looks up which team an invite ID belongs to.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns the ID, handle, display name and description of the team an invite ID belongs to, e.g. before Join Team By Invite.',
    idempotent: true,
  },
  props: {
    inviteId: Property.ShortText({
      displayName: 'Invite ID',
      description: 'Team invite ID, from an invite link or the "invite_id" field of Get Team.',
      required: true,
    }),
  },
  async run(context) {
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/teams/invite/${encodeURIComponent(context.propsValue.inviteId)}`,
    });
  },
});
