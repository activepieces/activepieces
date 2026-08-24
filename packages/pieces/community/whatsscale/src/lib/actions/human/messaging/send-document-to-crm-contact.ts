import { createAction, Property } from '@activepieces/pieces-framework';
import { sendMessageResultOutputSchema } from '../../../output-schemas';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../../auth';
import { whatsscaleClient } from '../../../common/client';
import { ConductorSendMessageResult, flattenSendMessageResult } from '../../../common/messaging';
import { whatsscaleProps } from '../../../common/props';
import { prepareMediaFile } from '../../../common/prepare-file';
import { pollJob } from '../../../common/poll-job';

export const sendDocumentToCrmContactAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_send_document_to_crm_contact',
  classification: 'WRITE',
  displayName: 'Send a Document to a CRM Contact',
  description: 'Send a document to a WhatsScale CRM contact selected from the dropdown.',
  audience: 'human',
  aiMetadata: { description: 'Sends a document/file to a contact stored in the WhatsScale CRM, identified by CRM contact ID chosen from the dropdown, with an optional display filename and caption. Pick this when the recipient is a managed CRM record; use the plain contact, group, manual-entry, or channel document variants for non-CRM recipients. Takes either a directly downloadable document URL or a file from a previous step. Not idempotent: each call delivers another document.', idempotent: false },
  outputSchema: sendMessageResultOutputSchema,
  props: {
    session: whatsscaleProps.session,
    crmContact: whatsscaleProps.crmContact,
    documentUrl: Property.File({
      displayName: 'Document',
      description: 'A direct URL to the document, or a file from a previous step.',
      required: true,
    }),
    filename: Property.ShortText({
      displayName: 'Filename',
      description: 'Optional filename shown in WhatsApp (e.g. report.pdf). Auto-detected from the file if not provided.',
      required: false,
    }),
    caption: Property.ShortText({
      displayName: 'Caption',
      description: 'Optional caption for the document (max 1024 characters).',
      required: false,
    }),
  },
  async run(context) {
    const { session, crmContact, documentUrl, filename, caption } = context.propsValue;
    const apiKey = context.auth.secret_text;

    const preparedUrl = await prepareMediaFile({ apiKey, file: documentUrl, files: context.files, mediaType: 'document' });

    const body: Record<string, unknown> = {
      session,
      contact_type: 'crm_contact',
      crm_contact_id: crmContact,
      file: preparedUrl,
      caption: caption ?? '',
    };
    if (filename) body['filename'] = filename;

    const sendResponse = await whatsscaleClient(apiKey, HttpMethod.POST, '/api/sendDocument', body);
    const { jobId } = sendResponse.body as { jobId: string };
    const result = await pollJob(apiKey, jobId);
    return flattenSendMessageResult(result as ConductorSendMessageResult);
  },
});
