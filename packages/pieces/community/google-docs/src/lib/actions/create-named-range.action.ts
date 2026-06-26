import { googleDocsAuth, createGoogleClient } from '../auth';
import { docsCommon } from '../common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { docs as googleDocs, docs_v1 } from '@googleapis/docs';

export const createNamedRange = createAction({
  auth: googleDocsAuth,
  name: 'create_named_range',
  displayName: 'Create Named Range',
  description: 'Create a named range over a character range in a Google Docs document',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a named range over a specified character range in a Google Docs document body and returns the new namedRangeId. Named ranges let you bookmark a region for later operations (e.g. deletion, styling) by ID or by name. The startIndex and endIndex must be valid character positions inside the document body — obtain them from Get Document End Index or Read Document (cannot be guessed). Not idempotent.',
    idempotent: false,
  },
  props: {
    documentId: Property.ShortText({
      displayName: 'Document ID',
      description: 'The ID of the document to add a named range to (from the document URL or Search Documents).',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Range Name',
      description: 'A human-readable name for the range. Multiple named ranges in the same document can share the same name.',
      required: true,
    }),
    startIndex: Property.Number({
      displayName: 'Start Index',
      description:
        'Inclusive start character index of the range. Obtain from Get Document End Index or Read Document — cannot be guessed.',
      required: true,
    }),
    endIndex: Property.Number({
      displayName: 'End Index',
      description:
        'Exclusive end character index of the range. Must be greater than Start Index. Obtain from Get Document End Index or Read Document — cannot be guessed.',
      required: true,
    }),
  },
  async run(context) {
    const { documentId, name, startIndex, endIndex } = context.propsValue;
    if (endIndex <= startIndex) {
      throw new Error('End Index must be greater than Start Index.');
    }

    const authClient = await createGoogleClient(context.auth);
    const docs = googleDocs({ version: 'v1', auth: authClient });

    const request: docs_v1.Schema$Request = {
      createNamedRange: {
        name,
        range: { startIndex, endIndex },
      },
    };

    try {
      const response = await docs.documents.batchUpdate({
        documentId,
        requestBody: { requests: [request] },
      });
      const namedRangeId = response.data.replies?.[0]?.createNamedRange?.namedRangeId ?? null;
      return { success: true, documentId, name, namedRangeId };
    } catch (error) {
      throw new Error(docsCommon.formatError(error, 'create the named range in'));
    }
  },
});
