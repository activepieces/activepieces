import { createAction, Property } from '@activepieces/pieces-framework';
import { signNowAuth, getSignNowBearerToken } from '../common/auth';
import { signNowClient, signNowData } from '../common/client';
import { signNowSchemas } from '../common/schemas';

export const sendFreeFormInviteAction = createAction({
  auth: signNowAuth,
  name: 'send_free_form_invite',
  displayName: 'Send Free Form Invite',
  description: 'Sends a free form invite to sign an existing document.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Emails one signer a free form invite to sign an existing SignNow document, where the signer places their own signature without predefined roles. Use for documents without roles; for documents with roles use Invite to Sign. The sender email must belong to the connected SignNow account. Each call sends another email, so it is not idempotent.',
    idempotent: false,
  },
  outputSchema: signNowSchemas.freeFormInvite,
  props: {
    document_id: Property.ShortText({
      displayName: 'Document ID',
      description: 'The ID of the document to send for signing.',
      required: true,
    }),
    to: Property.ShortText({
      displayName: "Signer's Email",
      description: 'Email address of the signer.',
      required: true,
    }),
    from: Property.ShortText({
      displayName: "Sender's Email",
      description: 'The email address of your SignNow account.',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Email Subject',
      description: 'Subject line of the invite email.',
      required: false,
    }),
    message: Property.LongText({
      displayName: 'Email Message',
      description: 'Body of the invite email.',
      required: false,
    }),
  },
  async run(context) {
    const { subject, message } = context.propsValue;
    const document_id = signNowData.requiredText({ value: context.propsValue.document_id, label: 'Document ID' });
    const to = signNowData.requiredText({ value: context.propsValue.to, label: "Signer's Email" });
    const from = signNowData.requiredText({ value: context.propsValue.from, label: "Sender's Email" });
    const body = await signNowClient.request({
      token: getSignNowBearerToken(context.auth),
      method: 'POST',
      path: `/document/${signNowClient.segment(document_id)}/invite`,
      operation: 'send free form invite',
      body: signNowData.dropUndefined({ to, from, subject, message }),
    });
    return {
      id: signNowData.textAt({ value: body, key: 'id' }) ?? null,
      result: signNowData.textAt({ value: body, key: 'result' }) ?? signNowData.textAt({ value: body, key: 'status' }) ?? null,
    };
  },
});
