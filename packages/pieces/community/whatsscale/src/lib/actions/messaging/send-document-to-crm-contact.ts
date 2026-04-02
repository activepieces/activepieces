import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../auth';
import { whatsscaleClient } from '../../common/client';
import { whatsscaleProps } from '../../common/props';
import { prepareFile } from '../../common/prepare-file';
import { pollJob } from '../../common/poll-job';

export const sendDocumentToCrmContactAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_send_document_to_crm_contact',
  displayName: 'Send a Document to a CRM Contact',
  description: 'Send a document to a WhatsScale CRM contact selected from the dropdown.',
  props: {
    session: whatsscaleProps.session,
    crmContact: whatsscaleProps.crmContact,
    documentUrl: Property.ShortText({
      displayName: 'Document URL',
      description: 'Direct URL to the document file.',
      required: true,
    }),
    filename: Property.ShortText({
      displayName: 'Filename',
      description: 'Optional filename shown in WhatsApp (e.g. report.pdf). Auto-detected from URL if not provided.',
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

    const preparedUrl = await prepareFile(apiKey, documentUrl, 'document');

    const body: Record<string, unknown> = {
      session,
      contact_type: 'crm_contact',
      crm_contact_id: crmContact,
      file: preparedUrl,
      caption: caption ?? '',
    };
    if (filename) body['filename'] = filename;

    const sendResponse = await whatsscaleClient(apiKey, HttpMethod.POST, '/api/sendDocument', { ...body, platform: 'activepieces' });
    const { jobId } = sendResponse.body as { jobId: string };
    return await pollJob(apiKey, jobId);
  },
});
