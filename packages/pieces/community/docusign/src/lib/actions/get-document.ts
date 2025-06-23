import { EnvelopesApi } from 'docusign-esign';

import { createAction, Property } from '@activepieces/pieces-framework';

import { docusignAuth, DocusignAuthType } from '../..';
import { createApiClient } from '../common';

export const getDocument = createAction({
  name: 'getDocument',
  displayName: 'Get document',
  description: 'Get document from a specific envelope',
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
    documentId: Property.ShortText({
      displayName: 'Document ID',
      description:
        'The ID of the document to retrieve. Alternatively, you can use one of the following special keywords:\n' +
        '\n' +
        'combined: Retrieves all of the documents as a single PDF file. When the query parameter certificate is true, the certificate of completion is included in the PDF file. When the query parameter certificate is false, the certificate of completion is not included in the PDF file.\n' +
        'archive: Retrieves a ZIP archive that contains all of the PDF documents and the certificate of completion.\n' +
        'certificate: Retrieves only the certificate of completion as a PDF file.\n' +
        'portfolio: Retrieves the envelope documents as a PDF portfolio.\n',
      required: true,
    }),
  },
  async run({ auth, propsValue, files }) {
    const apiClient = await createApiClient(auth as DocusignAuthType);
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
