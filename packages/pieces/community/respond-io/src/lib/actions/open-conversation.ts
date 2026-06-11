import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { respondIoApiCall } from '../common/client';
import { respondIoAuth } from '../common/auth';
import { contactIdentifierDropdown } from '../common/props';

export const openConversation = createAction({
  auth: respondIoAuth,
  name: 'open_conversation',
  displayName: 'Open Conversation',
  description: 'Mark a conversation as open in Respond.io.',
  audience: 'both',
  aiMetadata: { description: 'Sets a contact\'s conversation status to open in Respond.io, identified by the contact identifier. Use to (re)open a conversation so it appears in active queues. Idempotent — opening an already-open conversation leaves it open.', idempotent: true },
  props: {
    identifier: contactIdentifierDropdown,
  },
  async run({ propsValue, auth }) {
    const { identifier } = propsValue;

    return await respondIoApiCall({
      method: HttpMethod.POST,
      url: `/contact/${identifier}/conversation/status`,
      auth: auth,
      body: {
        status: 'open',
      },
    });
  },
});
