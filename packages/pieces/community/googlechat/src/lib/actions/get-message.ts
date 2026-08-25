import { createAction, Property } from '@activepieces/pieces-framework';
import { propsValidation } from '@activepieces/pieces-common';
import { googleChatApiAuth, googleChatCommon } from '../common';
import { googleChatAPIService } from '../common/requests';

export const getMessageDetails = createAction({
  auth: googleChatApiAuth,
  name: 'getMessageDetails',
  displayName: 'Get Message Details',
  description: 'Retrieve details of a specific message by ID. Supports both system-generated and custom message IDs.',
  audience: 'both',
  aiMetadata: {
    description: 'Fetches a single Google Chat message by its full resource name (spaces/{space}/messages/{message}); accepts either a system-generated or a custom message ID. Use when you already know the message identifier and need its content or metadata. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Message Resource Name',
      description: 'The full resource name of the message. Format: spaces/{space}/messages/{message}',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, googleChatCommon.getMessageSchema);

    const { name } = propsValue;

    const message = await googleChatAPIService.getMessage(
      auth.access_token,
      name
    );

    return message;
  },
});
