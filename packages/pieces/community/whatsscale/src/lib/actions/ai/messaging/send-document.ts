import { createAction, Property } from '@activepieces/pieces-framework';
import { sendMessageResultOutputSchema } from '../../../output-schemas';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../../auth';
import { whatsscaleClient } from '../../../common/client';
import { ConductorSendMessageResult, flattenSendMessageResult } from '../../../common/messaging';
import { whatsscaleProps } from '../../../common/props';
import { ChatType } from '../../../common/types';
import { buildRecipientBody, RecipientType } from '../../../common/recipients';
import { prepareFile } from '../../../common/prepare-file';
import { pollJob } from '../../../common/poll-job';

export const sendDocumentManualAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_send_document_manual',
  classification: 'WRITE',
  displayName: 'Send a Document (By ID)',
  description: 'Send a document to a contact, group, channel, or CRM contact by ID rather than picking from a list.',
  audience: 'ai',
  aiMetadata: { description: 'Sends a document/file to a recipient identified directly by ID rather than a builder dropdown, with an optional display filename and caption. Set recipient_type to contact (phone number with country code), group or channel (bare ID, no @ suffix needed), or crm_contact (WhatsScale CRM contact ID). Requires a directly downloadable document URL; the send completes asynchronously. Not idempotent: each call delivers another document.', idempotent: false },
  outputSchema: sendMessageResultOutputSchema,
  props: {
    session: whatsscaleProps.session,
    chatType: Property.StaticDropdown({
      displayName: 'Recipient Type',
      description: 'Who this document is being sent to.',
      required: true,
      options: {
        options: [
          { label: 'Contact (Phone Number)', value: ChatType.CONTACT },
          { label: 'Group', value: ChatType.GROUP },
          { label: 'Channel', value: ChatType.CHANNEL },
          { label: 'CRM Contact', value: ChatType.CRM_CONTACT },
        ],
      },
    }),
    recipient: Property.ShortText({
      displayName: 'Recipient ID',
      description:
        'Contact: phone number with country code. Group/Channel: the bare ID, no @ suffix needed. CRM Contact: the CRM contact ID.',
      required: true,
    }),
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
    const { session, chatType, recipient, documentUrl, filename, caption } = context.propsValue;
    const apiKey = context.auth.secret_text;

    const preparedUrl = await prepareFile(apiKey, documentUrl, 'document');

    const recipientBody = buildRecipientBody(
      RecipientType.MANUAL,
      session,
      recipient,
      chatType as ChatType,
    );

    const body: Record<string, unknown> = {
      ...recipientBody,
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
