import { createAction, Property } from '@activepieces/pieces-framework';
import { signNowAuth, getSignNowBearerToken } from '../common/auth';
import { signNowClient, signNowData } from '../common/client';
import { signNowSchemas } from '../common/schemas';

export const sendInviteAction = createAction({
  auth: signNowAuth,
  name: 'send_invite',
  displayName: 'Invite to Sign',
  description: 'Sends an invite to sign an existing document.',
  audience: 'both',
  classification: 'WRITE',
  outputSchema: signNowSchemas.status,
  aiMetadata: {
    description:
      'Sends a role-based field invite for an existing SignNow document, emailing each named signer to sign. Use when you already have an uploaded document with defined roles and want recipients to sign. Requires the document ID, the sender email tied to the SignNow account, and one signer entry per role (email, role name, signing order); signers sharing an order sign in parallel. Each call dispatches new invite emails, so it is not idempotent.',
    idempotent: false,
  },
  props: {
    document_id: Property.ShortText({
      displayName: 'Document ID',
      description: 'The ID of the document to send for signing.',
      required: true,
    }),
    from: Property.ShortText({
      displayName: "Sender's Email",
      description: 'Must be the email address associated with your SignNow account.',
      required: true,
    }),
    signers: Property.Array({
      displayName: 'Signers',
      description: 'One entry per signer role, each with an email, role name and signing order.',
      required: true,
      properties: {
        email: Property.ShortText({
          displayName: 'Email',
          description: "Signer's email address.",
          required: true,
        }),
        role: Property.ShortText({
          displayName: 'Role Name',
          description: 'The role name as it appears in the document, such as Signer 1.',
          required: true,
        }),
        order: Property.Number({
          displayName: 'Signing Order',
          description: 'Signers with the same order number sign in parallel.',
          required: true,
          defaultValue: 1,
        }),
        subject: Property.ShortText({
          displayName: 'Email Subject',
          description: 'Custom email subject for this signer.',
          required: false,
        }),
        message: Property.LongText({
          displayName: 'Email Message',
          description: 'Custom email body for this signer.',
          required: false,
        }),
        redirect_uri: Property.ShortText({
          displayName: 'Redirect URL',
          description: 'URL the signer is redirected to after signing.',
          required: false,
        }),
        language: Property.StaticDropdown({
          displayName: 'Language',
          description: "Language for this signer's signing session and emails.",
          required: false,
          options: {
            options: [
              { label: 'English', value: 'en' },
              { label: 'Spanish', value: 'es' },
              { label: 'French', value: 'fr' },
            ],
          },
        }),
        expiration_days: Property.Number({
          displayName: 'Expiration Days',
          description: 'Days until this invite expires, from 3 to 180.',
          required: false,
        }),
      },
    }),
    subject: Property.ShortText({
      displayName: 'Email Subject (All Signers)',
      description: 'Default email subject for all signers.',
      required: false,
    }),
    message: Property.LongText({
      displayName: 'Email Message (All Signers)',
      description: 'Default email body for all signers.',
      required: false,
    }),
    cc: Property.Array({
      displayName: 'CC Recipients',
      description: 'Email addresses to CC on the invite.',
      required: false,
    }),
    cc_subject: Property.ShortText({
      displayName: 'CC Email Subject',
      description: 'Subject line for CC recipient emails.',
      required: false,
    }),
    cc_message: Property.LongText({
      displayName: 'CC Email Message',
      description: 'Body message for CC recipient emails.',
      required: false,
    }),
  },
  async run(context) {
    const { document_id, from, signers, subject, message, cc, cc_subject, cc_message } = context.propsValue;
    return signNowClient.request({
      token: getSignNowBearerToken(context.auth),
      method: 'POST',
      path: `/document/${signNowClient.segment(document_id)}/invite`,
      operation: 'send invite',
      body: signNowData.dropUndefined({
        to: signNowData.roleSigners({ signers, withExpiration: true }),
        from: from.trim(),
        subject,
        message,
        cc: signNowData.ccList(cc),
        cc_subject,
        cc_message,
      }),
    });
  },
});
