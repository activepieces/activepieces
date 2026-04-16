import { EnvelopesApi } from 'docusign-esign';

import { createAction, Property } from '@activepieces/pieces-framework';

import { docusignAuth } from '../auth';
import { createApiClient } from '../common';

export const getDocument = createAction({
  name: 'getDocument',
  displayName: 'Get Document',
  description: 'Download a document from an envelope as a file.',
  auth: docusignAuth,
  props: {
    accountId: Property.ShortText({
      displayName: 'Account ID',
      required: true,
    }),
    envelopeId: Property.ShortText({
      displayName: 'Envelope ID',
      required: true,
    }),
    documentId: Property.StaticDropdown({
      displayName: 'Document',
      description:
        'Choose a specific document by its numeric ID, or select a special option to download all documents at once.',
      required: true,
      options: {
        options: [
          {
            label: 'Combined PDF (all documents + certificate)',
            value: 'combined',
          },
          {
            label: 'Archive ZIP (all documents)',
            value: 'archive',
          },
          {
            label: 'Certificate of Completion only',
            value: 'certificate',
          },
          {
            label: 'Portfolio PDF',
            value: 'portfolio',
          },
          { label: 'Document 1', value: '1' },
          { label: 'Document 2', value: '2' },
          { label: 'Document 3', value: '3' },
          { label: 'Document 4', value: '4' },
          { label: 'Document 5', value: '5' },
        ],
      },
    }),
  },
  async run({ auth, propsValue, files }) {
    const apiClient = await createApiClient(auth);
    const envelopeApiClient = new EnvelopesApi(apiClient);
    const filename =
      propsValue.documentId === 'archive' ? 'archive.zip' : 'document.pdf';
    return await files.write({
      fileName: filename,
      data: Buffer.from(
        await envelopeApiClient.getDocument(
          propsValue.accountId,
          propsValue.envelopeId,
          propsValue.documentId,
          {}
        ),
        'binary'
      ),
    });
  },
});
