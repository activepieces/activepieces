import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostClient } from '../../../common/client';
import { mattermostArchiveChannelOutputSchema } from '../../../output-schemas';

export const deleteCommandAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_delete_command',
  outputSchema: mattermostArchiveChannelOutputSchema,
  displayName: 'Delete Slash Command',
  description: 'Deletes a custom slash command.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes a custom slash command. Takes the ID from List Slash Commands or Create Slash Command. Needs the manage_slash_commands permission in the command\'s team. Not idempotent: a second call fails because the command is gone.',
    idempotent: false,
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
      method: HttpMethod.DELETE,
      path: `/commands/${encodeURIComponent(context.propsValue.commandId)}`,
    });
  },
});
