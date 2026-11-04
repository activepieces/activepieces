import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostClient } from '../../../common/client';
import { mattermostCreateTeamOutputSchema } from '../../../output-schemas';

export const createTeamAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_create_team',
  outputSchema: mattermostCreateTeamOutputSchema,
  displayName: 'Create Team',
  description: 'Creates a team.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a team; the connected user becomes its admin. Type "O" lets anyone on the server join, "I" is invite-only. Not idempotent: a taken name fails.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Unique handle used in the team URL: lowercase letters, numbers and "-", e.g. "engineering".',
      required: true,
    }),
    displayName: Property.ShortText({
      displayName: 'Display Name',
      description: 'Team name shown to users.',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Type',
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
    description: Property.ShortText({
      displayName: 'Description',
      description: 'What the team is for.',
      required: false,
    }),
  },
  async run(context) {
    const { name, displayName, type, description } = context.propsValue;
    if (type !== 'O' && type !== 'I') {
      throw new Error(`Type must be "O" or "I", got "${type}".`);
    }
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/teams',
      body: { name, display_name: displayName, type, description },
    });
  },
});
