import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { frontAuth } from '../common/auth';
import { frontProps } from '../common/props';
import { makeRequest } from '../common/client';

export const createDraftReply = createAction({
  auth: frontAuth,
  name: 'create_draft_reply',
  displayName: 'Create Draft Reply',
  description: 'Create a draft reply to an existing conversation.',
  props: {
    conversation_id: frontProps.conversation(),
    channel_id: frontProps.channel({ required: true }),
    author_id: frontProps.teammate({
      displayName: 'Author',
      description: 'The teammate creating the draft.',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Body (HTML)',
      description: 'The content of the draft reply. HTML is supported.',
      required: true,
    }),
    to: Property.Array({
      displayName: 'To (Add Recipients)',
      description: 'Add new recipients to the conversation.',
      required: false,
    }),
    cc: Property.Array({ displayName: 'CC', required: false }),
    bcc: Property.Array({ displayName: 'BCC', required: false }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description:
        'New subject for the conversation. If omitted, the subject will not be changed.',
      required: false,
    }),
    quote_body: Property.LongText({
      displayName: 'Quote Body',
      description: 'The body of a previous message to quote in the reply.',
      required: false,
    }),
  },
  async run(context) {
    const { conversation_id, ...props } = context.propsValue;
    const token = context.auth;

    const body = {
      channel_id: props.channel_id,
      author_id: props.author_id,
      body: props.body,
      to: props.to,
      cc: props.cc,
      bcc: props.bcc,
      subject: props.subject,
      quote_body: props.quote_body,
    };

    return await makeRequest(
      token,
      HttpMethod.POST,
      `/conversations/${conversation_id}/drafts`,
      body
    );
  },
});
