import { EnvelopesApi } from 'docusign-esign';

import { ApFile, createAction, Property } from '@activepieces/pieces-framework';

import { docusignAuth } from '../auth';
import { createApiClient } from '../common';

export const createAndSendEnvelope = createAction({
  auth: docusignAuth,
  name: 'createAndSendEnvelope',
  displayName: 'Send Document for Signing',
  description:
    'Upload a document and send it to one or more people to sign via DocuSign.',
  props: {
    accountId: Property.ShortText({
      displayName: 'Account ID',
      required: true,
    }),
    emailSubject: Property.ShortText({
      displayName: 'Email Subject',
      description: 'Subject line of the email sent to all recipients.',
      required: true,
    }),
    emailBlurb: Property.LongText({
      displayName: 'Email Message',
      description:
        'Optional message body included in the signing request email.',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Action',
      required: true,
      defaultValue: 'sent',
      options: {
        options: [
          { label: 'Send immediately', value: 'sent' },
          { label: 'Save as draft', value: 'created' },
        ],
      },
    }),
    documents: Property.Array({
      displayName: 'Documents',
      required: true,
      description: 'Documents to include in the envelope.',
      properties: {
        file: Property.File({
          displayName: 'File',
          description: 'PDF or other supported document to upload.',
          required: true,
        }),
        name: Property.ShortText({
          displayName: 'Document Name',
          description: 'Display name shown to signers.',
          required: true,
        }),
        fileExtension: Property.ShortText({
          displayName: 'File Extension',
          description: 'Extension without dot, e.g. pdf, docx.',
          required: false,
          defaultValue: 'pdf',
        }),
      },
    }),
    signers: Property.Array({
      displayName: 'Signers',
      required: true,
      description: 'Recipients who must sign the envelope.',
      properties: {
        name: Property.ShortText({
          displayName: 'Name',
          required: true,
        }),
        email: Property.ShortText({
          displayName: 'Email',
          required: true,
        }),
        routingOrder: Property.Number({
          displayName: 'Routing Order',
          description:
            'Order in which this signer receives the envelope. Lower numbers go first.',
          required: false,
          defaultValue: 1,
        }),
      },
    }),
    carbonCopies: Property.Array({
      displayName: 'Carbon Copies (CC)',
      required: false,
      description:
        'Recipients who receive a copy of the completed envelope but do not sign.',
      properties: {
        name: Property.ShortText({
          displayName: 'Name',
          required: true,
        }),
        email: Property.ShortText({
          displayName: 'Email',
          required: true,
        }),
        routingOrder: Property.Number({
          displayName: 'Routing Order',
          required: false,
          defaultValue: 1,
        }),
      },
    }),
  },
  async run({ auth, propsValue }) {
    const apiClient = await createApiClient(auth);
    const envelopeApiClient = new EnvelopesApi(apiClient);

    type DocItem = { file: ApFile; name: string; fileExtension?: string };
    type SignerItem = { name: string; email: string; routingOrder?: number };
    type CcItem = { name: string; email: string; routingOrder?: number };

    const docs = propsValue.documents as unknown as DocItem[];
    const signers = propsValue.signers as unknown as SignerItem[];
    const ccs = (propsValue.carbonCopies ?? []) as unknown as CcItem[];

    return await envelopeApiClient.createEnvelope(propsValue.accountId, {
      envelopeDefinition: {
        emailSubject: propsValue.emailSubject,
        ...(propsValue.emailBlurb ? { emailBlurb: propsValue.emailBlurb } : {}),
        documents: docs.map((doc, index) => ({
          documentId: String(index + 1),
          name: doc.name,
          documentBase64: doc.file.base64,
          fileExtension: doc.fileExtension ?? 'pdf',
        })),
        recipients: {
          signers: signers.map((signer, index) => ({
            recipientId: String(index + 1),
            name: signer.name,
            email: signer.email,
            routingOrder: String(signer.routingOrder ?? 1),
          })),
          ...(ccs.length > 0
            ? {
                carbonCopies: ccs.map((cc, index) => ({
                  recipientId: String(signers.length + index + 1),
                  name: cc.name,
                  email: cc.email,
                  routingOrder: String(cc.routingOrder ?? 1),
                })),
              }
            : {}),
        },
        status: propsValue.status,
      },
    });
  },
});
