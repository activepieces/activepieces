import { googleDocsAuth, createGoogleClient } from '../auth';
import { docsCommon } from '../common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { docs as googleDocs, docs_v1 } from '@googleapis/docs';

export const createFooter = createAction({
  auth: googleDocsAuth,
  name: 'create_footer',
  displayName: 'Create Footer',
  description: 'Create a footer section in a Google Docs document',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a footer section in a Google Docs document and returns the new footerId. Use this when you need to add a footer to a document before inserting footer text — the footerId returned here is required by any subsequent Insert Text call targeting the footer segment. Each call creates a new footer; not idempotent.',
    idempotent: false,
  },
  props: {
    documentId: Property.ShortText({
      displayName: 'Document ID',
      description: 'The ID of the document to add a footer to (from the document URL or Search Documents).',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Footer Type',
      description: 'The type of footer to create. DEFAULT is the standard document footer.',
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
      createFooter: {
        type: (type ?? 'DEFAULT') as docs_v1.Schema$CreateFooterRequest['type'],
      },
    };

    try {
      const response = await docs.documents.batchUpdate({
        documentId,
        requestBody: { requests: [request] },
      });
      const footerId = response.data.replies?.[0]?.createFooter?.footerId ?? null;
      return { success: true, documentId, footerId };
    } catch (error) {
      throw new Error(docsCommon.formatError(error, 'create the footer in'));
    }
  },
});
