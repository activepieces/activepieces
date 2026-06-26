import { googleDocsAuth, createGoogleClient } from '../auth';
import { docsCommon } from '../common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { docs as googleDocs, docs_v1 } from '@googleapis/docs';

export const createHeader = createAction({
  auth: googleDocsAuth,
  name: 'create_header',
  displayName: 'Create Header',
  description: 'Create a header section in a Google Docs document',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a header section in a Google Docs document and returns the new headerId. Use this when you need to add a header to a document before inserting header text — the headerId returned here is required by any subsequent Insert Text call targeting the header segment. Each call creates a new header; not idempotent.',
    idempotent: false,
  },
  props: {
    documentId: Property.ShortText({
      displayName: 'Document ID',
      description: 'The ID of the document to add a header to (from the document URL or Search Documents).',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Header Type',
      description: 'The type of header to create. DEFAULT is the standard document header.',
      required: false,
      defaultValue: 'DEFAULT',
      options: {
        options: [
          { label: 'Default', value: 'DEFAULT' },
        ],
      },
    }),
  },
  async run(context) {
    const { documentId, type } = context.propsValue;
    const authClient = await createGoogleClient(context.auth);
    const docs = googleDocs({ version: 'v1', auth: authClient });

    const request: docs_v1.Schema$Request = {
      createHeader: {
        type: (type ?? 'DEFAULT') as docs_v1.Schema$CreateHeaderRequest['type'],
      },
    };

    try {
      const response = await docs.documents.batchUpdate({
        documentId,
        requestBody: { requests: [request] },
      });
      const headerId = response.data.replies?.[0]?.createHeader?.headerId ?? null;
      return { success: true, documentId, headerId };
    } catch (error) {
      throw new Error(docsCommon.formatError(error, 'create the header in'));
    }
  },
});
