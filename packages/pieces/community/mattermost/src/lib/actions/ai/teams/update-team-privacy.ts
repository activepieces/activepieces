import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostUpdateTeamPrivacyOutputSchema } from '../../../output-schemas';

export const updateTeamPrivacyAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_update_team_privacy',
  outputSchema: mattermostUpdateTeamPrivacyOutputSchema,
  displayName: 'Update Team Privacy',
  description: 'Switches a team between open and invite only.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Sets a team to "O" (open: anyone on the server can join) or "I" (invite only). Needs the manage_team permission.',
    idempotent: true,
  },
  props: {
    teamId: mattermostAiProps.teamId({ required: true }),
    privacy: Property.StaticDropdown({
      displayName: 'Privacy',
      description: '"O" for open, "I" for invite only.',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Open', value: 'O' },
          { label: 'Invite only', value: 'I' },
        ],
      },
    }),
  },
  async run(context) {
    const { teamId, privacy } = context.propsValue;
    if (privacy !== 'O' && privacy !== 'I') {
      throw new Error(`Privacy must be "O" or "I", got "${privacy}".`);
    }
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: `/teams/${encodeURIComponent(teamId)}/privacy`,
      body: { privacy },
    });
  },
});
