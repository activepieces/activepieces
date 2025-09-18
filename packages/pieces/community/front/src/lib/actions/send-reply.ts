import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { conversationDropdown, teammateDropdown, tagsMultiSelectDropdown } from '../common/props';

export const sendReply = createAction({
  auth: frontAuth,
  name: 'send_reply',
  displayName: 'Send Reply',
  description: 'Post a reply to a conversation.',
  props: {
    conversation_id: conversationDropdown,
    body: Property.LongText({
        displayName: 'Body',
        description: 'The content of the reply. HTML is supported.',
        required: true,
    }),
    author_id: teammateDropdown({
        displayName: 'Author',
        description: "The teammate sending the reply. Defaults to the connection's owner.",
        required: false,
    }),
    tag_ids: tagsMultiSelectDropdown({
        displayName: 'Tags to Add',
        description: 'Tags to add to the conversation upon replying.',
        required: false,
    }),
    archive: Property.Checkbox({
        displayName: 'Archive after replying',
        description: 'Whether to archive the conversation after the reply is sent.',
        required: false,
        defaultValue: false,
    }),
    to: Property.Array({ displayName: 'To', required: false }),
    cc: Property.Array({ displayName: 'Cc', required: false }),
    bcc: Property.Array({ displayName: 'Bcc', required: false }),
    subject: Property.ShortText({ displayName: 'Subject', required: false }),
  },

  async run(context) {
    const { conversation_id, tag_ids, archive, ...propsBody } = context.propsValue;
    const token = context.auth;

    const options: Record<string, unknown> = {};
    if (tag_ids && tag_ids.length > 0) {
        options['tag_ids'] = tag_ids;
    }
    if (archive) {
        options['archive'] = true;
    }

    // FIX 2: Explicitly type `body` as a flexible record.
    const body: Record<string, unknown> = { ...propsBody };
    if (Object.keys(options).length > 0) {
        body['options'] = options;
    }

    // Clean up empty array fields
    ['to', 'cc', 'bcc'].forEach(prop => {
        if (Array.isArray(body[prop]) && (body[prop] as unknown[]).length === 0) {
            delete body[prop];
        }
    });

    return await makeRequest(
        token,
        HttpMethod.POST,
        `/conversations/${conversation_id}/messages`,
        body
    );
  },
});