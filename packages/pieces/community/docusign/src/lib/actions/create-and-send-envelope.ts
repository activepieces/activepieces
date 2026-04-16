import { EnvelopesApi } from 'docusign-esign';

import { createAction, Property } from '@activepieces/pieces-framework';

import { docusignAuth } from '../auth';
import { createApiClient } from '../common';

export const createAndSendEnvelope = createAction({
  auth: docusignAuth,
  name: 'createAndSendEnvelope',
  displayName: 'Create and Send Envelope',
  description:
    'Create a new envelope with documents and recipients and send it for signing.',
  props: {
    accountId: Property.ShortText({
      displayName: 'Account ID',
      required: true,
    }),
    emailSubject: Property.ShortText({
      displayName: 'Email Subject',
      description:
        'Subject line of the email sent to all recipients. Required when status is "sent".',
      required: true,
    }),
    emailBlurb: Property.LongText({
      displayName: 'Email Message',
      description:
        'Optional message body included in the signing request email.',
      required: false,
    }),
    documents: Property.Json({
      displayName: 'Documents',
      required: true,
      description: `Array of documents to include in the envelope. Each item should have:
- documentId (string, required): Unique identifier for the document within the envelope, e.g. "1".
- name (string, required): Display name of the document.
- documentBase64 (string, required): Base64-encoded content of the document.
- fileExtension (string, required): File extension without dot, e.g. "pdf".
- order (string, optional): Order the document appears in the envelope, e.g. "1".`,
    }),
    signers: Property.Json({
      displayName: 'Signers',
      required: true,
      description: `Array of signer recipients who must sign. Each item should have:
- recipientId (string, required): Unique identifier for the recipient within the envelope, e.g. "1".
- name (string, required): Full name of the signer.
- email (string, required): Email address of the signer.
- routingOrder (string, optional): Order in which this signer receives the envelope, e.g. "1".
- tabs (object, optional): Signing tabs placed on documents. Keys are tab types (e.g. signHereTabs, dateTabs, textTabs) and values are arrays of tab definitions per the DocuSign API.`,
    }),
    carbonCopies: Property.Json({
      displayName: 'Carbon Copies (CC)',
      required: false,
      description: `Optional array of recipients who receive a copy of the signed envelope but do not sign. Each item should have:
- recipientId (string, required): Unique identifier for the recipient within the envelope.
- name (string, required): Full name.
- email (string, required): Email address.
- routingOrder (string, optional): Order in which this recipient receives the copy.`,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Send the envelope immediately or save it as a draft.',
      required: true,
      defaultValue: 'sent',
      options: {
        options: [
          { label: 'Send', value: 'sent' },
          { label: 'Save as Draft', value: 'created' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const apiClient = await createApiClient(auth);
    const envelopeApiClient = new EnvelopesApi(apiClient);

    const documents = propsValue.documents as unknown as Array<{
      documentId: string;
      name: string;
      documentBase64: string;
      fileExtension: string;
      order?: string;
    }>;

    const signers = propsValue.signers as unknown as Array<{
      recipientId: string;
      name: string;
      email: string;
      routingOrder?: string;
      tabs?: Record<string, unknown[]>;
    }>;

    const carbonCopies = (propsValue.carbonCopies ?? []) as unknown as Array<{
      recipientId: string;
      name: string;
      email: string;
      routingOrder?: string;
    }>;

    return await envelopeApiClient.createEnvelope(propsValue.accountId, {
      envelopeDefinition: {
        emailSubject: propsValue.emailSubject,
        ...(propsValue.emailBlurb ? { emailBlurb: propsValue.emailBlurb } : {}),
        documents: documents.map((doc) => ({
          documentId: doc.documentId,
          name: doc.name,
          documentBase64: doc.documentBase64,
          fileExtension: doc.fileExtension,
          ...(doc.order ? { order: doc.order } : {}),
        })),
        recipients: {
          signers: signers.map((signer) => ({
            recipientId: signer.recipientId,
            name: signer.name,
            email: signer.email,
            ...(signer.routingOrder
              ? { routingOrder: signer.routingOrder }
              : {}),
            ...(signer.tabs ? { tabs: signer.tabs } : {}),
          })),
          ...(carbonCopies.length > 0
            ? {
                carbonCopies: carbonCopies.map((cc) => ({
                  recipientId: cc.recipientId,
                  name: cc.name,
                  email: cc.email,
                  ...(cc.routingOrder ? { routingOrder: cc.routingOrder } : {}),
                })),
              }
            : {}),
        },
        status: propsValue.status,
      },
    });
  },
});
