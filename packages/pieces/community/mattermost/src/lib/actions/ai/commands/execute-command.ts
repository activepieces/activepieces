import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostExecuteCommandOutputSchema } from '../../../output-schemas';

export const executeCommandAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_execute_command',
  outputSchema: mattermostExecuteCommandOutputSchema,
  displayName: 'Execute Slash Command',
  description: 'Runs a slash command in a channel as the connected user.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Runs a built-in or custom slash command in a channel as the connected user, exactly as if typed there, and returns the command\'s response. Use List Slash Commands to see which triggers exist in the team. Not idempotent: the command\'s effect happens again on each call.',
    idempotent: false,
  },
  props: {
    channelId: mattermostAiProps.channelId({ required: true }),
    command: Property.ShortText({
      displayName: 'Command',
      description: 'Full command with its leading "/" and arguments, e.g. "/echo hello".',
      required: true,
    }),
  },
  async run(context) {
    const { channelId, command } = context.propsValue;
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/commands/execute',
      body: { channel_id: channelId, command },
    });
  },
});
