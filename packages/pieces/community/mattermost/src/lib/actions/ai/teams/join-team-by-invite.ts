import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostClient } from '../../../common/client';
import { mattermostAddTeamMemberOutputSchema } from '../../../output-schemas';

export const joinTeamByInviteAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_join_team_by_invite',
  outputSchema: mattermostAddTeamMemberOutputSchema,
  displayName: 'Join Team By Invite',
  description: 'Joins a team as the connected user with an invite ID or email invite token.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Adds the connected user to a team using exactly one of: a team invite ID (from Get Team or Regenerate Team Invite ID) or the token from an email invitation link.',
    idempotent: false,
  },
  props: {
    inviteId: Property.ShortText({
      displayName: 'Invite ID',
      description: 'Team invite ID, the "invite_id" field of Get Team. Set this or Token, not both.',
      required: false,
    }),
    token: Property.ShortText({
      displayName: 'Token',
      description: 'Token from an email invitation link. Set this or Invite ID, not both.',
      required: false,
    }),
  },
  async run(context) {
    const { inviteId, token } = context.propsValue;
    if ((inviteId === undefined) === (token === undefined)) {
      throw new Error('Set exactly one of Invite ID or Token.');
    }
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/teams/members/invite',
      query: inviteId !== undefined ? { invite_id: inviteId } : { token: token ?? '' },
    });
  },
});
