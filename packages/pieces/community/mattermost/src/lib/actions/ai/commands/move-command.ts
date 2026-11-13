import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostArchiveChannelOutputSchema } from '../../../output-schemas';

export const moveCommandAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_move_command',
  outputSchema: mattermostArchiveChannelOutputSchema,
  displayName: 'Move Slash Command',
  description: 'Moves a custom slash command to another team.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Moves a custom slash command to another team. Takes the ID from List Slash Commands or Create Slash Command. Needs the manage_slash_commands permission in both teams; fails if the trigger word is already used in the destination team.',
    idempotent: true,
  },
  props: {
    commandId: Property.ShortText({
      displayName: 'Command ID',
      description: 'Custom slash command ID (26 characters). Use List Slash Commands or Create Slash Command to find it.',
      required: true,
    }),
    teamId: mattermostAiProps.teamId({
      required: true,
      displayName: 'Destination Team ID',
    }),
  },
  async run(context) {
    const { commandId, teamId } = context.propsValue;
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: `/commands/${encodeURIComponent(commandId)}/move`,
      body: { team_id: teamId },
    });
  },
});
