import { createAction, Property } from '@activepieces/pieces-framework';
import { signNowAuth, getSignNowBearerToken } from '../common/auth';
import { signNowClient, signNowData } from '../common/client';
import { signNowSchemas } from '../common/schemas';

export const createDocumentFromTemplateAndSendInviteAction = createAction({
  auth: signNowAuth,
  name: 'create_document_from_template_and_send_invite',
  displayName: 'Create Document From Template & Send Free Form Invite',
  description:
    'Creates a new document from a template and sends a free form invite to a signer.',
  audience: 'human',
  classification: 'WRITE',
  outputSchema: signNowSchemas.composite,
  aiMetadata: {
    description:
      'Copies a SignNow template into a new document and sends a free-form (no predefined roles) signing invite to a single signer, returning the new document ID. Use for templates where the signer fills fields freely rather than by assigned role; for role-based templates use the role-based invite action instead. Requires the template ID, the signer email, and the sender email tied to the SignNow account. Each call creates a new document and dispatches an invite, so it is not idempotent.',
    idempotent: false,
  },
  props: {
    template_id: Property.ShortText({
      displayName: 'Template ID',
      description: 'The ID of the template to create the document from.',
      required: true,
    }),
    document_name: Property.ShortText({
      displayName: 'Document Name',
      description: 'Name for the new document, or leave empty to use the template name.',
      required: false,
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
      description: 'Subject line of the invite email sent to the signer.',
      required: false,
    }),
    message: Property.LongText({
      displayName: 'Email Message',
      description: 'Body message of the invite email sent to the signer.',
      required: false,
    }),
    cc: Property.Array({
      displayName: 'CC Recipients',
      description: 'Email addresses to CC on the invite.',
      required: false,
    }),
    cc_subject: Property.ShortText({
      displayName: 'CC Email Subject',
      description: 'Subject line of the email sent to CC recipients.',
      required: false,
    }),
    cc_message: Property.LongText({
      displayName: 'CC Email Message',
      description: 'Body message of the email sent to CC recipients.',
      required: false,
    }),
    language: Property.StaticDropdown({
      displayName: 'Language',
      description: 'Language for the signing session and notification emails.',
      required: false,
      options: {
        options: [
          { label: 'English', value: 'en' },
          { label: 'Spanish', value: 'es' },
          { label: 'French', value: 'fr' },
        ],
      },
    }),
    redirect_uri: Property.ShortText({
      displayName: 'Redirect URL',
      description: 'URL the signer is redirected to after signing.',
      required: false,
    }),
    close_redirect_uri: Property.ShortText({
      displayName: 'Close Redirect URL',
      description: 'URL that opens when the signer clicks the Close button.',
      required: false,
    }),
    redirect_target: Property.StaticDropdown({
      displayName: 'Redirect Target',
      description: 'Whether to open the redirect URL in a new tab or the same tab.',
      required: false,
      options: {
        options: [
          { label: 'New tab', value: 'blank' },
          { label: 'Same tab', value: 'self' },
        ],
      },
    }),
  },
  async run(context) {
    const { template_id, document_name, to, from, subject, message, cc, cc_subject, cc_message, language, redirect_uri, close_redirect_uri, redirect_target } =
      context.propsValue;
    const token = getSignNowBearerToken(context.auth);
    const created = await signNowClient.request({
      token,
      method: 'POST',
      path: `/template/${signNowClient.segment(template_id)}/copy`,
      operation: 'create document from template',
      body: signNowData.dropUndefined({ document_name: document_name?.trim() }),
    });
    const document_id = signNowData.textAt({ value: created, key: 'id' });
    if (document_id === undefined || document_id === '') {
      throw new Error('SignNow did not return a document ID for the template copy.');
    }
    const createdName = signNowData.optionalText({ value: created, key: 'name' }) ??
      signNowData.optionalText({ value: created, key: 'document_name' }) ??
      (document_name?.trim() || null);
    const inviteBody = signNowData.dropUndefined({
      to: to.trim(),
      from: from.trim(),
      subject,
      message,
      cc: signNowData.ccList(cc),
      cc_subject,
      cc_message,
      language,
      redirect_uri,
      close_redirect_uri,
      redirect_target,
    });
    try {
      const invite = await signNowClient.request({
        token,
        method: 'POST',
        path: `/document/${signNowClient.segment(document_id)}/invite`,
        operation: 'send invite',
        body: inviteBody,
      });
      return { document_id, document_name: createdName, invite };
    } catch (error) {
      throw new Error(
        `Document ${document_id} was created, but sending the invite failed: ${error instanceof Error ? error.message : 'unknown error'}`
      );
    }
  },
});
