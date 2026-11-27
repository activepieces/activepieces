import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

const SIGNATURE_COLORS = ['blue', 'black', 'red'];

export const createSignRequestAction = createAction({
  auth: boxAuth,
  name: 'box_create_sign_request',
  displayName: 'Create Sign Request',
  description: 'Sends Box files out for e-signature with Box Sign.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a Box Sign request from up to 10 files or a template (from List Sign Templates) and emails the signers, returning the request ID and status. Give Source File IDs, Template ID or both. Track it with Get Sign Request; Cancel Sign Request stops it.',
    idempotent: false,
  },
  props: {
    signers: Property.Json({
      displayName: 'Signers',
      description: 'Up to 35 signers: [{"email": "a@example.com", "role": "signer", "order": 1}]. Role is "signer", "approver" or "final_copy_reader".',
      required: true,
    }),
    sourceFileIds: Property.Array({
      displayName: 'Source File IDs',
      description: 'IDs of up to 10 files to sign. Get them from Search or List Folder Items.',
      required: false,
    }),
    templateId: boxAiProps.signTemplateId({ required: false }),
    parentFolderId: boxAiProps.folderId({
      required: false,
      displayName: 'Parent Folder ID',
      description: 'Folder for the signed document and signing log; cannot be "0". Defaults to the first source file\'s folder or "My Sign Requests".',
    }),
    name: Property.ShortText({ displayName: 'Name', description: 'Name of the sign request.', required: false }),
    emailSubject: Property.ShortText({
      displayName: 'Email Subject',
      description: 'Subject of the email to signers. Defaults to a Box subject.',
      required: false,
    }),
    emailMessage: Property.LongText({
      displayName: 'Email Message',
      description: 'Message in the email to signers; simple HTML tags like a, b, i and u are allowed.',
      required: false,
    }),
    daysValid: Property.Number({
      displayName: 'Days Valid',
      description: 'Days (0-730) until the request expires if not completed. Leave empty for no expiry.',
      required: false,
    }),
    isDocumentPreparationNeeded: boxAiProps.booleanFlag({
      required: false,
      displayName: 'Document Preparation Needed',
      description: '"true" to get a prepare_url for placing fields in the Box UI before sending, instead of sending right away.',
    }),
    areRemindersEnabled: boxAiProps.booleanFlag({
      required: false,
      displayName: 'Reminders Enabled',
      description: '"true" to remind outstanding signers on days 3, 8, 13 and 18.',
    }),
    signatureColor: Property.StaticDropdown({
      displayName: 'Signature Color',
      description: '"blue", "black" or "red".',
      required: false,
      options: { options: SIGNATURE_COLORS.map((value) => ({ label: value, value })) },
    }),
    prefillTags: Property.Json({
      displayName: 'Prefill Tags',
      description: 'Values for sign tags in the document or template: [{"document_tag_id": "tag1", "text_value": "Acme"}] (or checkbox_value / date_value).',
      required: false,
    }),
    additionalFields: Property.Json({
      displayName: 'Additional Fields',
      description: 'Other Box Sign request fields, e.g. {"redirect_url": "https://...", "declined_redirect_url": "https://...", "are_text_signatures_enabled": false, "external_id": "123", "request_flow": "standard"}.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const sourceFileIds = propsValue.sourceFileIds?.length ? propsValue.sourceFileIds.map(String) : undefined;
    if (sourceFileIds === undefined && propsValue.templateId === undefined) {
      throw new Error('Give Source File IDs or Template ID.');
    }
    if (sourceFileIds !== undefined && sourceFileIds.length > 10) {
      throw new Error('Source File IDs can hold at most 10 IDs.');
    }
    if (propsValue.signatureColor !== undefined && !SIGNATURE_COLORS.includes(propsValue.signatureColor)) {
      throw new Error(`Signature Color must be one of: ${SIGNATURE_COLORS.join(', ')}.`);
    }
    return await boxClient.request({
      auth,
      method: HttpMethod.POST,
      path: '/sign_requests',
      body: {
        ...(propsValue.additionalFields ?? {}),
        signers: propsValue.signers,
        ...(sourceFileIds !== undefined ? { source_files: sourceFileIds.map((id) => ({ id, type: 'file' })) } : {}),
        ...(propsValue.templateId !== undefined ? { template_id: propsValue.templateId } : {}),
        ...(propsValue.parentFolderId !== undefined ? { parent_folder: { id: propsValue.parentFolderId, type: 'folder' } } : {}),
        ...(propsValue.name !== undefined ? { name: propsValue.name } : {}),
        ...(propsValue.emailSubject !== undefined ? { email_subject: propsValue.emailSubject } : {}),
        ...(propsValue.emailMessage !== undefined ? { email_message: propsValue.emailMessage } : {}),
        ...(propsValue.daysValid !== undefined && propsValue.daysValid !== null ? { days_valid: propsValue.daysValid } : {}),
        ...(propsValue.isDocumentPreparationNeeded !== undefined
          ? { is_document_preparation_needed: propsValue.isDocumentPreparationNeeded === 'true' }
          : {}),
        ...(propsValue.areRemindersEnabled !== undefined ? { are_reminders_enabled: propsValue.areRemindersEnabled === 'true' } : {}),
        ...(propsValue.signatureColor !== undefined ? { signature_color: propsValue.signatureColor } : {}),
        ...(propsValue.prefillTags !== undefined ? { prefill_tags: propsValue.prefillTags } : {}),
      },
    });
  },
});
