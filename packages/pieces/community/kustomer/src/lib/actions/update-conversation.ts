import { createAction, Property } from '@activepieces/pieces-framework';

import { kustomerAuth } from '../common/auth';
import { kustomerClient } from '../common/client';
import { kustomerUtils } from '../common/utils';
import { KustomerJsonObject, KustomerJsonValue } from '../common/types';

export const updateConversationAction = createAction({
  auth: kustomerAuth,
  name: 'update-conversation',
  displayName: 'Update Conversation',
  description: 'Updates an existing conversation in Kustomer.',
  props: {
    conversationId: Property.ShortText({
      displayName: 'Conversation ID',
      description:
        'The Kustomer ID of the conversation to update. You can get this from the "Create Conversation" action output or from the URL when viewing a conversation in Kustomer.',
      required: true,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Change the status of the conversation.',
      required: false,
      options: {
        options: [
          { label: 'Open', value: 'open' },
          { label: 'Done', value: 'done' },
          { label: 'Snoozed', value: 'snoozed' },
        ],
      },
    }),
    priority: Property.StaticDropdown({
      displayName: 'Priority',
      description: 'Conversation priority from 1 (lowest) to 5 (highest).',
      required: false,
      options: {
        options: [
          { label: '1 — Lowest', value: 1 },
          { label: '2 — Low', value: 2 },
          { label: '3 — Medium', value: 3 },
          { label: '4 — High', value: 4 },
          { label: '5 — Highest', value: 5 },
        ],
      },
    }),
    name: Property.ShortText({
      displayName: 'Conversation Name',
      description: 'Update the subject or title of the conversation.',
      required: false,
    }),
    direction: Property.StaticDropdown({
      displayName: 'Direction',
      description:
        '"Inbound" means the customer initiated the conversation; "Outbound" means your team initiated it.',
      required: false,
      options: {
        options: [
          { label: 'Inbound', value: 'in' },
          { label: 'Outbound', value: 'out' },
        ],
      },
    }),
    replyChannel: Property.ShortText({
      displayName: 'Reply Channel',
      description:
        'The channel used to reply in this conversation (e.g. "email", "chat").',
      required: false,
    }),
  },
  async run(context) {
    const apiKey = context.auth.secret_text as string;
    const props = context.propsValue;

    const updates: KustomerJsonObject = {};

    if (props.status) updates['status'] = props.status;
    if (props.priority !== null && props.priority !== undefined)
      updates['priority'] = props.priority;
    if (props.name !== null && props.name !== undefined)
      updates['name'] = props.name;
    if (props.direction) updates['direction'] = props.direction;
    if (props.replyChannel !== null && props.replyChannel !== undefined)
      updates['replyChannel'] = props.replyChannel;

    const response = await kustomerClient.updateConversation({
      apiKey,
      conversationId: props.conversationId,
      updates,
    });

    return response;
  },
});
