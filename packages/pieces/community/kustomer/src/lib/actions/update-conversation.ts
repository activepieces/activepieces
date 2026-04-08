import { createAction, Property } from '@activepieces/pieces-framework';

import { kustomerAuth } from '../common/auth';
import { kustomerClient } from '../common/client';
import { kustomerUtils } from '../common/utils';

export const updateConversationAction = createAction({
  auth: kustomerAuth,
  name: 'update-conversation',
  displayName: 'Update Conversation',
  description: 'Updates a conversation in Kustomer.',
  props: {
    conversationId: Property.ShortText({
      displayName: 'Conversation ID',
      description: 'The Kustomer conversation ID.',
      required: true,
    }),
    updates: Property.Json({
      displayName: 'Updates',
      description:
        'A JSON object sent directly to `PUT /conversations/{id}`. Example: `{ "status": "done" }`.',
      required: true,
    }),
  },
  async run(context) {
    const apiKey = kustomerUtils.parseAuthToken({
      value: context.auth,
    });
    const conversationId = kustomerUtils.parseRequiredString({
      value: context.propsValue.conversationId,
      fieldName: 'Conversation ID',
    });
    const updates = kustomerUtils.parseJsonObject({
      value: context.propsValue.updates,
      fieldName: 'Updates',
    });

    return kustomerClient.updateConversation({
      apiKey,
      conversationId,
      updates,
    });
  },
});
