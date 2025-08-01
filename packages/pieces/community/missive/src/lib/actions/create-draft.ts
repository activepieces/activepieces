import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { missiveAuth } from '../../';
import { missiveApiCall } from '../common/utils';

export const createDraftAction = createAction({
  auth: missiveAuth,
  name: 'create_draft',
  displayName: 'Create Draft/Post',
  description: 'Create a draft message or post in Missive, with option to send',
  props: {
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'The subject of the message',
      required: false,
    }),
    body: Property.LongText({
      displayName: 'Body',
      description: 'The body content of the message',
      required: true,
    }),
    to: Property.Array({
      displayName: 'To',
      description: 'Email addresses to send to',
      required: false,
    }),
    cc: Property.Array({
      displayName: 'CC',
      description: 'Email addresses to CC',
      required: false,
    }),
    bcc: Property.Array({
      displayName: 'BCC',
      description: 'Email addresses to BCC',
      required: false,
    }),
    conversationId: Property.ShortText({
      displayName: 'Conversation ID',
      description: 'The ID of the conversation to reply to',
      required: false,
    }),
    send: Property.Checkbox({
      displayName: 'Send Immediately',
      description: 'Whether to send the message immediately or save as draft',
      required: true,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { subject, body, to, cc, bcc, conversationId, send } = context.propsValue;
    const apiToken = context.auth.apiToken;

    const draftData: Record<string, unknown> = {
      body,
    };

    if (subject) draftData.subject = subject;
    if (to && to.length > 0) draftData.to = to;
    if (cc && cc.length > 0) draftData.cc = cc;
    if (bcc && bcc.length > 0) draftData.bcc = bcc;
    if (conversationId) draftData.conversation_id = conversationId;
    if (send) draftData.send = send;

    const response = await missiveApiCall(
      apiToken,
      '/drafts',
      HttpMethod.POST,
      { draft: draftData }
    );

    return response;
  },
}); 