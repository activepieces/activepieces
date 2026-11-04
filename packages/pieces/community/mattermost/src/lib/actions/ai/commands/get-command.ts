import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostClient } from '../../../common/client';
import { mattermostCreateCommandOutputSchema } from '../../../output-schemas';

export const getCommandAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_get_command',
  outputSchema: mattermostCreateCommandOutputSchema,
  displayName: 'Get Slash Command',
  description: 'Gets a custom slash command by ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one custom slash command with its trigger, request URL, method and token. Takes the ID from List Slash Commands or Create Slash Command. Needs the manage_slash_commands permission in the command\'s team.',
    idempotent: true,
  },
  props: {
    commandId: Property.ShortText({
      displayName: 'Command ID',
      description: 'Custom slash command ID (26 characters). Use List Slash Commands or Create Slash Command to find it.',
      required: true,
    }),
  },
  async run(context) {
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/commands/${encodeURIComponent(context.propsValue.commandId)}`,
    });
  },
});
