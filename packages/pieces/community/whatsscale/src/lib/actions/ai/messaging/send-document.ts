import { createAction, Property } from '@activepieces/pieces-framework';
import { sendMessageResultOutputSchema } from '../../../output-schemas';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../../auth';
import { whatsscaleClient } from '../../../common/client';
import { ConductorSendMessageResult, flattenSendMessageResult } from '../../../common/messaging';
import { whatsscaleProps } from '../../../common/props';
import { ChatType } from '../../../common/types';
import { buildRecipientBody, RecipientType } from '../../../common/recipients';
import { prepareMediaFile } from '../../../common/prepare-file';
import { pollJob } from '../../../common/poll-job';

export const sendDocumentManualAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_send_document_manual',
  classification: 'WRITE',
  displayName: 'Send a Document (By ID)',
  description: 'Send a document to a contact, group, channel, or CRM contact by ID rather than picking from a list.',
  audience: 'ai',
  aiMetadata: { description: 'Sends a document/file to a recipient identified directly by ID rather than a builder dropdown, with an optional display filename and caption. Set chatType to contact (phone number with country code), group or channel (bare ID, no @ suffix needed), or crm_contact (WhatsScale CRM contact ID). Takes either a directly downloadable document URL or a file from a previous step; the send completes asynchronously. Not idempotent: each call delivers another document.', idempotent: false },
  outputSchema: sendMessageResultOutputSchema,
  props: {
    session: whatsscaleProps.session,
    chatType: Property.StaticDropdown({
      displayName: 'Recipient Type',
      description: 'Who this document is being sent to.',
      required: true,
      display: 'cards',
      options: {
        options: [
          { label: 'Contact', value: ChatType.CONTACT, description: 'A phone number with country code', icon: 'user' },
          { label: 'Group', value: ChatType.GROUP, description: 'A WhatsApp group by ID', icon: 'users' },
          { label: 'Channel', value: ChatType.CHANNEL, description: 'A WhatsApp Channel by ID', icon: 'send' },
          { label: 'CRM Contact', value: ChatType.CRM_CONTACT, description: 'A WhatsScale CRM contact by ID', icon: 'tag' },
        ],
      },
    }),
    recipient: Property.ShortText({
      displayName: 'Recipient ID',
      description:
        'Contact: phone number with country code. Group/Channel: the bare ID, no @ suffix needed. CRM Contact: the CRM contact ID.',
      required: true,
    }),
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
  propertyGroups: [
    { key: 'destination', display: 'section' as const, label: 'Destination', props: ['session', 'chatType', 'recipient'] },
    { key: 'content', display: 'section' as const, label: 'Document', props: ['documentUrl', 'filename', 'caption'] },
  ],
  async run(context) {
    const { session, chatType, recipient, documentUrl, filename, caption } = context.propsValue;
    const apiKey = context.auth.secret_text;

    const preparedUrl = await prepareMediaFile({ apiKey, file: documentUrl, files: context.files, mediaType: 'document' });

    const recipientBody = buildRecipientBody(
      RecipientType.MANUAL,
      session,
      recipient,
      chatType,
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
