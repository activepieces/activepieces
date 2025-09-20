import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { frontProps } from '../common/props';

export const sendReply = createAction({
  auth: frontAuth,
  name: 'send_reply',
  displayName: 'Send Reply',
  description: 'Post a reply to a conversation.',
  props: {
  conversation_id: frontProps.conversation(),
  body: Property.LongText({
    displayName: 'Body (HTML)',
    description: 'The content of the reply. HTML is supported.',
    required: true,
  }),
  author_id: frontProps.teammate({ required: false }),
  to: Property.Array({
    displayName: 'To (Add Recipients)',
    description: 'Add new recipients to the conversation.',
    required: false,
  }),
  cc: Property.Array({ displayName: 'CC', required: false }),
  subject: Property.ShortText({
    displayName: 'Subject',
    description: 'New subject for the conversation. If omitted, the subject will not be changed.',
    required: false,
  }),
  tag_ids: frontProps.tags({ required: false }),
  archive: Property.Checkbox({
    displayName: 'Archive After Replying',
    required: false,
    defaultValue: false,
  }),
},
  async run(context) {
    const { conversation_id, tag_ids, archive, ...messageBody } =
      context.propsValue;
    const token = context.auth;

    const options: { tag_ids?: string[]; archive?: boolean } = {};
    if (tag_ids && tag_ids.length > 0) options.tag_ids = tag_ids;
    if (archive) options.archive = true;

    const body = {
      ...messageBody,
      options: Object.keys(options).length > 0 ? options : undefined,
    };

    return await makeRequest(
      token,
      HttpMethod.POST,
      `/conversations/${conversation_id}/messages`,
      body
    );
  },
});
