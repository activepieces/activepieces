import { createAction, Property } from '@activepieces/pieces-framework';
import { signNowAuth, getSignNowBearerToken } from '../common/auth';
import { signNowClient, signNowData } from '../common/client';
import { signNowSchemas } from '../common/schemas';

export const createDocumentGroupFromTemplateAndSendInviteAction = createAction({
  auth: signNowAuth,
  name: 'create_document_group_from_template_and_send_invite',
  displayName: 'Create Document Group From Template Group & Send Invite',
  description:
    'Creates a new document group from a template group and sends an invite to one or more signers.',
  audience: 'human',
  classification: 'WRITE',
  outputSchema: signNowSchemas.groupComposite,
  aiMetadata: {
    description:
      'Creates a new SignNow document group from a document-group template and sends a multi-step group invite to its signers, returning the group ID and per-document IDs. Use when several documents must be signed together as a package; for a single document use the document-template invite actions instead. Requires the document-group template ID, a group name, and one signer entry per recipient (email, role name, permitted action of sign/approve/view, and signing step); signers sharing a step act in parallel and each may target a specific document or all of them. Each call creates a new group and dispatches invites, so it is not idempotent.',
    idempotent: false,
  },
  props: {
    template_id: Property.ShortText({
      displayName: 'Document Group Template ID',
      description: 'The unique ID of the document group template.',
      required: true,
    }),
    group_name: Property.ShortText({
      displayName: 'Document Group Name',
      description: 'Name for the new document group.',
      required: true,
    }),
    signers: Property.Array({
      displayName: 'Signers',
      description: 'One entry per recipient, each with an email, role name, action and step.',
      required: true,
      properties: {
        email: Property.ShortText({
          displayName: 'Email',
          description: "Signer's email address.",
          required: true,
        }),
        role_name: Property.ShortText({
          displayName: 'Role Name',
          description: 'The role name as it appears in the template, such as Signer 1.',
          required: true,
        }),
        document_id: Property.ShortText({
          displayName: 'Document ID',
          description: 'The document in the group for this signer, or leave empty for the first document.',
          required: false,
        }),
        action: Property.StaticDropdown({
          displayName: 'Action',
          description: 'What this recipient is allowed to do with the document.',
          required: true,
          options: {
            options: [
              { label: 'Sign', value: 'sign' },
              { label: 'Approve', value: 'approve' },
              { label: 'View', value: 'view' },
            ],
          },
        }),
        order: Property.Number({
          displayName: 'Signing Step',
          description: 'Signers with the same step number act in parallel.',
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
        language: Property.StaticDropdown({
          displayName: 'Language',
          description: 'Language for this signer\'s signing session and emails.',
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
          description: 'URL the signer is redirected to after completing the document.',
          required: false,
        }),
      },
    }),
    cc: Property.Array({
      displayName: 'CC Recipients',
      description: 'Email addresses to CC on the invite.',
      required: false,
    }),
  },
  async run(context) {
    const { template_id, group_name, signers, cc } = context.propsValue;
    const recipients = groupRecipients(signers);
    const token = getSignNowBearerToken(context.auth);
    const created = await signNowClient.request({
      token,
      method: 'POST',
      path: `/v2/document-group-templates/${signNowClient.segment(template_id)}/document-group`,
      operation: 'create document group from template',
      body: { group_name },
    });
    const data = signNowData.isRecord(created) && signNowData.isRecord(created['data']) ? created['data'] : created;
    const documentGroupId = signNowData.textAt({ value: data, key: 'unique_id' });
    if (documentGroupId === undefined || documentGroupId === '') {
      throw new Error('SignNow did not return a document group ID.');
    }
    const documents = signNowData.recordsAt({ value: data, key: 'documents' }).map((document) => ({
      id: signNowData.textAt({ value: document, key: 'id' }) ?? '',
      name: signNowData.textAt({ value: document, key: 'document_name' }) ?? null,
    }));
    const fallbackDocumentId = documents.find((document) => document.id !== '')?.id;
    const missingIndex = recipients.findIndex((recipient) => recipient.document_id === undefined && fallbackDocumentId === undefined);
    if (missingIndex >= 0) {
      throw new Error(
        `Document group ${documentGroupId} was created, but it has no documents, so recipient ${missingIndex + 1} needs a Document ID.`
      );
    }
    const steps = [...new Set(recipients.map((recipient) => recipient.order))].sort((a, b) => a - b);
    const invite_steps = steps.map((order) => {
      const stepRecipients = recipients.filter((recipient) => recipient.order === order);
      const invite_emails = stepRecipients
        .filter((recipient) => recipient.subject !== undefined || recipient.message !== undefined)
        .map((recipient) => signNowData.dropUndefined({ email: recipient.email, subject: recipient.subject, message: recipient.message }));
      return signNowData.dropUndefined({
        order,
        invite_actions: stepRecipients.map((recipient) =>
          signNowData.dropUndefined({
            email: recipient.email,
            role_name: recipient.role_name,
            action: recipient.action,
            document_id: recipient.document_id ?? fallbackDocumentId,
            redirect_uri: recipient.redirect_uri,
            language: recipient.language,
          })
        ),
        invite_emails: invite_emails.length > 0 ? invite_emails : undefined,
      });
    });
    try {
      const invite = await signNowClient.request({
        token,
        method: 'POST',
        path: `/documentgroup/${signNowClient.segment(documentGroupId)}/groupinvite`,
        operation: 'send document group invite',
        body: signNowData.dropUndefined({ invite_steps, cc: signNowData.ccList(cc) }),
      });
      return {
        document_group_id: documentGroupId,
        document_group_name: group_name,
        invite_id: signNowData.textAt({ value: invite, key: 'id' }) ?? null,
        pending_invite_link: signNowData.textAt({ value: invite, key: 'pending_invite_link' }) ?? null,
        documents,
      };
    } catch (error) {
      throw new Error(
        `Document group ${documentGroupId} was created, but sending the invite failed: ${error instanceof Error ? error.message : 'unknown error'}`
      );
    }
  },
});

function groupRecipients(signers: unknown): GroupRecipient[] {
  const entries = Array.isArray(signers) ? signers.filter(signNowData.isRecord) : [];
  if (entries.length === 0) {
    throw new Error('Add at least one recipient with an email, role name and action.');
  }
  return entries.map((entry, index) => {
    const email = signNowData.optionalText({ value: entry, key: 'email' });
    const role_name = signNowData.optionalText({ value: entry, key: 'role_name' });
    const action = signNowData.optionalText({ value: entry, key: 'action' });
    if (email === undefined || role_name === undefined || action === undefined) {
      throw new Error(`Recipient ${index + 1} needs an email, a role name and an action.`);
    }
    return {
      email: email.trim(),
      role_name,
      action,
      order: signNowData.numberAt({ value: entry, key: 'order' }) ?? 1,
      document_id: signNowData.optionalText({ value: entry, key: 'document_id' }),
      subject: signNowData.optionalText({ value: entry, key: 'subject' }),
      message: signNowData.optionalText({ value: entry, key: 'message' }),
      language: signNowData.optionalText({ value: entry, key: 'language' }),
      redirect_uri: signNowData.optionalText({ value: entry, key: 'redirect_uri' }),
    };
  });
}

type GroupRecipient = {
  email: string;
  role_name: string;
  action: string;
  order: number;
  document_id?: string;
  subject?: string;
  message?: string;
  language?: string;
  redirect_uri?: string;
};
