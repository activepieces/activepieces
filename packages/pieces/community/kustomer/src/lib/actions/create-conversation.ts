import { createAction, Property } from '@activepieces/pieces-framework';

import { kustomerAuth } from '../common/auth';
import { kustomerClient } from '../common/client';
import { kustomerUtils } from '../common/utils';

export const createConversationAction = createAction({
  auth: kustomerAuth,
  name: 'create-conversation',
  displayName: 'Create Conversation',
  description: 'Creates a conversation in Kustomer.',
  props: {
    conversation: Property.Json({
      displayName: 'Conversation',
      description:
        'A JSON object sent directly to `POST /conversations`. Include the conversation fields required by your Kustomer workspace.',
      required: true,
    }),
  },
  async run(context) {
    const apiKey = kustomerUtils.parseAuthToken({
      value: context.auth,
    });
    const conversation = kustomerUtils.parseJsonObject({
      value: context.propsValue.conversation,
      fieldName: 'Conversation',
    });

    return kustomerClient.createConversation({
      apiKey,
      conversation,
    });
  },
});
