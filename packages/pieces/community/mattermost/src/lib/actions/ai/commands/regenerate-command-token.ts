import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostClient } from '../../../common/client';

export const regenerateCommandTokenAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_regenerate_command_token',
  displayName: 'Regenerate Slash Command Token',
  description: 'Replaces a custom slash command\'s verification token.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Issues a new verification token for a custom slash command; the old token stops working, so the receiving service must be updated. Takes the ID from List Slash Commands or Create Slash Command. Not idempotent: each call issues a different token.',
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
      method: HttpMethod.PUT,
      path: `/commands/${encodeURIComponent(context.propsValue.commandId)}/regen_token`,
    });
  },
});
