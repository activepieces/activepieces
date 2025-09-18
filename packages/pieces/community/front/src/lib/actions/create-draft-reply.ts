import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { conversationDropdown, channelDropdown, teammateDropdown } from '../common/props';

export const createDraftReply = createAction({
  auth: frontAuth,
  name: 'create_draft_reply',
  displayName: 'Create Draft Reply',
  description: 'Create a draft reply to an existing conversation.',
  props: {
    conversation_id: conversationDropdown,
    channel_id: channelDropdown,
    body: Property.LongText({
        displayName: 'Body',
        description: 'The content of the draft. HTML is supported.',
        required: true,
    }),
    author_id: teammateDropdown({
        displayName: 'Author',
        description: "The teammate creating the draft. Defaults to the connection's owner.",
        required: false,
    }),
    to: Property.Array({ displayName: 'To', description: "List of recipient handles.", required: false }),
    cc: Property.Array({ displayName: 'Cc', required: false }),
    bcc: Property.Array({ displayName: 'Bcc', required: false }),
    subject: Property.ShortText({ displayName: 'Subject', required: false }),
    quote_body: Property.LongText({ 
        displayName: 'Quote Body',
        description: 'Body for the quote that the message is referencing.',
        required: false 
    }),
    mode: Property.StaticDropdown({
        displayName: 'Mode',
        description: "'private' is visible to the author only, 'shared' is visible to all teammates with access.",
        required: false,
        options: {
            options: [
                { label: 'Private', value: 'private' },
                { label: 'Shared', value: 'shared' },
            ]
        }
    }),
  },

  async run(context) {
    const { conversation_id, ...body } = context.propsValue;
    const token = context.auth;
    

    Object.keys(body).forEach(key => {
        const prop = body[key as keyof typeof body];
        if (prop === undefined || (Array.isArray(prop) && prop.length === 0)) {
            delete body[key as keyof typeof body];
        }
    });

    return await makeRequest(
        token,
        HttpMethod.POST,
        `/conversations/${conversation_id}/drafts`,
        body
    );
  },
});