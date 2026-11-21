import { createAction, Property } from '@activepieces/pieces-framework';
import { signNowAuth, getSignNowBearerToken } from '../common/auth';
import { signNowClient, signNowData } from '../common/client';
import { signNowSchemas } from '../common/schemas';

export const createDocumentFromTemplateAndSendRoleBasedInviteAction = createAction({
  auth: signNowAuth,
  name: 'create_document_from_template_and_send_role_based_invite',
  displayName: 'Create Document From Template & Send Role-Based Invite',
  description:
    'Creates a new document from a template with fillable fields and sends an invite to one or more signers by role.',
  audience: 'human',
  classification: 'WRITE',
  outputSchema: signNowSchemas.composite,
  aiMetadata: {
    description:
      'Copies a SignNow template into a new document and sends a role-based field invite to one or more signers matched to the template roles, returning the new document ID. Use for templates with predefined roles/fields where each signer is assigned by role name; for free-form signing use the free-form invite action instead. Requires the template ID, the sender email tied to the SignNow account, and one signer entry per role (email, role name, signing order); signers sharing an order sign in parallel. Each call creates a new document and dispatches invites, so it is not idempotent.',
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
    from: Property.ShortText({
      displayName: "Sender's Email",
      description: 'The email address of your SignNow account.',
      required: true,
    }),
    signers: Property.Array({
      displayName: 'Signers',
      description: 'One entry per template role, each with an email and a role name.',
      required: true,
      properties: {
        email: Property.ShortText({
          displayName: 'Email',
          description: "Signer's email address.",
          required: true,
        }),
        role: Property.ShortText({
          displayName: 'Role Name',
          description: 'The role name as it appears in the template, such as Signer 1.',
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
    expiration_days: Property.Number({
      displayName: 'Expiration Days',
      description: 'Days until the invite expires, from 1 to 180.',
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
  },
  async run(context) {
    const { template_id, document_name, from, signers, subject, message, cc, cc_subject, cc_message, expiration_days, language } = context.propsValue;
    const to = signNowData.roleSigners({ signers, withExpiration: false });
    if (expiration_days !== undefined && expiration_days !== null && (!Number.isInteger(expiration_days) || expiration_days < 1 || expiration_days > 180)) {
      throw new Error('Expiration days must be a whole number from 1 to 180.');
    }
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
      to,
      from: from.trim(),
      subject,
      message,
      cc: signNowData.ccList(cc),
      cc_subject,
      cc_message,
      general_expiration_days: expiration_days ?? undefined,
      language,
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
