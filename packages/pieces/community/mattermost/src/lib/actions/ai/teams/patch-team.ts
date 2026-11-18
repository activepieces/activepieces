import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostUtils } from '../../../common/utils';
import { mattermostCreateTeamOutputSchema } from '../../../output-schemas';

export const patchTeamAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_patch_team',
  outputSchema: mattermostCreateTeamOutputSchema,
  displayName: 'Update Team',
  description: 'Updates a team\'s display name, description, company name or open invite setting.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes only the team fields you set and leaves the rest as they are. To switch between open and invite-only use Update Team Privacy; to rotate the invite link use Regenerate Team Invite ID. Needs the manage_team permission.',
    idempotent: true,
  },
  props: {
    teamId: mattermostAiProps.teamId({ required: true }),
    displayName: Property.ShortText({
      displayName: 'Display Name',
      description: 'New team name shown to users.',
      required: false,
    }),
    description: Property.ShortText({
      displayName: 'Description',
      description: 'New team description.',
      required: false,
    }),
    companyName: Property.ShortText({
      displayName: 'Company Name',
      description: 'New company name.',
      required: false,
    }),
    allowOpenInvite: mattermostAiProps.booleanFlag({
      required: false,
      displayName: 'Allow Open Invite',
      description: '"true" lets any user on the server join the team without an invite.',
    }),
  },
  async run(context) {
    const { teamId, displayName, description, companyName, allowOpenInvite } = context.propsValue;
    const openInvite = mattermostUtils.parseBoolean({ value: allowOpenInvite });
    const body = {
      ...(displayName !== undefined ? { display_name: displayName } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(companyName !== undefined ? { company_name: companyName } : {}),
      ...(openInvite !== undefined ? { allow_open_invite: openInvite } : {}),
    };
    if (Object.keys(body).length === 0) {
      throw new Error('Set at least one of Display Name, Description, Company Name or Allow Open Invite.');
    }
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: `/teams/${encodeURIComponent(teamId)}/patch`,
      body,
    });
  },
});
