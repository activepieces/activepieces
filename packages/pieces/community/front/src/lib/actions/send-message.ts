import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { channelDropdown, teammateDropdown, tagsMultiSelectDropdown } from '../common/props';

export const sendMessage = createAction({
  auth: frontAuth,
  name: 'send_message',
  displayName: 'Send Message',
  description: 'Send a new message and start a conversation.',
  props: {
    channel_id: channelDropdown,
    to: Property.Array({
        displayName: 'To',
        description: 'List of recipient handles (e.g., email addresses, phone numbers).',
        required: true,
    }),
    body: Property.LongText({
        displayName: 'Body',
        description: 'The content of the message. HTML is supported.',
        required: true,
    }),
    author_id: teammateDropdown({
        displayName: 'Author',
        description: "The teammate sending the message. Defaults to the connection's owner.",
        required: false,
    }),
    subject: Property.ShortText({ displayName: 'Subject', required: false }),
    cc: Property.Array({ displayName: 'Cc', required: false }),
    bcc: Property.Array({ displayName: 'Bcc', required: false }),
    tag_ids: tagsMultiSelectDropdown({
        displayName: 'Tags to Add',
        description: 'Tags to add to the new conversation.',
        required: false,
    }),
    archive: Property.Checkbox({
        displayName: 'Archive after sending',
        description: 'Whether to archive the new conversation after the message is sent.',
        required: false,
        defaultValue: false,
    }),
  },

  async run(context) {
    const { channel_id, tag_ids, archive, ...propsBody } = context.propsValue;
    const token = context.auth;

    const options: Record<string, unknown> = {};
    if (tag_ids && tag_ids.length > 0) {
        options['tag_ids'] = tag_ids;
    }
    if (archive) {
        options['archive'] = true;
    }
    
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
        `/channels/${channel_id}/messages`,
        body
    );
  },
});