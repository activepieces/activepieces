import { createAction, Property } from '@activepieces/pieces-framework';

import { kustomerAuth } from '../common/auth';
import { kustomerClient } from '../common/client';
import { kustomerUtils } from '../common/utils';
import { KustomerJsonObject, KustomerJsonValue } from '../common/types';

export const createConversationAction = createAction({
  auth: kustomerAuth,
  name: 'create-conversation',
  displayName: 'Create Conversation',
  description: 'Creates a new conversation in Kustomer.',
  props: {
    customer: Property.ShortText({
      displayName: 'Customer ID',
      description:
        'The Kustomer ID of the customer this conversation belongs to. You can get this from the "Get Customer" action or from the URL when viewing a customer in Kustomer.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Conversation Name',
      description:
        'A short subject or title for the conversation (max 256 characters).',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'The initial status of the conversation.',
      required: false,
      defaultValue: 'open',
      options: {
        options: [
          { label: 'Open', value: 'open' },
          { label: 'Done', value: 'done' },
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
    externalId: Property.ShortText({
      displayName: 'External ID',
      description:
        'A unique identifier from your own system to link this conversation (max 256 characters).',
      required: false,
    }),
    replyChannel: Property.ShortText({
      displayName: 'Reply Channel',
      description:
        'The channel used to reply in this conversation (e.g. "email", "chat"). Leave empty to use the workspace default.',
      required: false,
    }),
  },
  async run(context) {
    const apiKey = context.auth.secret_text as string;
    const props = context.propsValue;

    const conversation: KustomerJsonObject = {
      customer: props.customer,
    };

    if (props.name) conversation['name'] = props.name;
    if (props.status) conversation['status'] = props.status;
    if (props.priority !== null && props.priority !== undefined)
      conversation['priority'] = props.priority;
    if (props.direction) conversation['direction'] = props.direction;
    if (props.externalId) conversation['externalId'] = props.externalId;
    if (props.replyChannel) conversation['replyChannel'] = props.replyChannel;

    const response = await kustomerClient.createConversation({
      apiKey,
      conversation,
    });

    return response;
  },
});
