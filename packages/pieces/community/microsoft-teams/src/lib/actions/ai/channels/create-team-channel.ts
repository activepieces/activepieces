import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftTeamsAuth } from '../../../auth';
import { microsoftTeamsAiProps } from '../../../common/ai-props';
import { microsoftTeamsClient } from '../../../common/client';
import { microsoftTeamsCreateChannelOutputSchema } from '../../../output-schemas';

const MEMBERSHIP_TYPES: string[] = ['standard', 'private'];

export const createTeamChannel = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_create_team_channel',
  outputSchema: microsoftTeamsCreateChannelOutputSchema,
  displayName: 'Create Team Channel',
  description: 'Creates a standard or private channel in a team.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a standard or private channel in one team; shared channels are not supported. Team IDs come from List Joined Teams. Not idempotent: each call adds another channel, so check List Channels first for the name.',
    idempotent: false,
  },
  props: {
    teamId: microsoftTeamsAiProps.teamId({ required: true }),
    displayName: Property.ShortText({
      displayName: 'Channel Name',
      description: 'The channel name, up to 50 characters.',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    membershipType: Property.StaticDropdown({
      displayName: 'Membership Type',
      description: 'standard (every team member) or private (only invited members). Defaults to standard.',
      required: false,
      options: {
        options: [
          { label: 'Standard', value: 'standard' },
          { label: 'Private', value: 'private' },
        ],
      },
    }),
  },
  async run(context) {
    const { teamId, displayName, description, membershipType } = context.propsValue;
    if (membershipType !== undefined && !MEMBERSHIP_TYPES.includes(membershipType)) {
      throw new Error(`Membership Type must be one of ${MEMBERSHIP_TYPES.join(', ')}, got '${membershipType}'.`);
    }
    const client = microsoftTeamsClient.create({ auth: context.auth });
    return await client.api(`/teams/${teamId}/channels`).post({ displayName, description, membershipType });
  },
});
