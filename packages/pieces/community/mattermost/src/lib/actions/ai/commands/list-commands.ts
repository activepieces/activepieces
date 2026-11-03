import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostUtils } from '../../../common/utils';
import { mattermostListCommandsOutputSchema } from '../../../output-schemas';

export const listCommandsAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_list_commands',
  outputSchema: mattermostListCommandsOutputSchema,
  displayName: 'List Slash Commands',
  description: 'Lists the slash commands of a team.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns the slash commands available in a team: the built-in system commands plus the custom ones the connection may manage, or only the custom ones with Custom Only set to "true". Listing custom commands needs the manage_slash_commands permission.',
    idempotent: true,
  },
  props: {
    teamId: mattermostAiProps.teamId({ required: true }),
    customOnly: mattermostAiProps.booleanFlag({
      required: false,
      displayName: 'Custom Only',
      description: '"true" to return only custom slash commands. Defaults to "false".',
    }),
  },
  async run(context) {
    const { teamId, customOnly } = context.propsValue;
    const custom = mattermostUtils.parseBoolean({ value: customOnly });
    const commands = await mattermostClient.request<unknown[]>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/commands',
      query: {
        team_id: teamId,
        ...(custom !== undefined ? { custom_only: String(custom) } : {}),
      },
    });
    return { commands, count: commands.length };
  },
});
