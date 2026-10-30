import { createAction } from '@activepieces/pieces-framework';
import type { DocumentSetVersion } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointListDocumentSetVersionsOutputSchema } from '../../../output-schemas';

export const listDocumentSetVersionsAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_list_document_set_versions',
  outputSchema: microsoftSharepointListDocumentSetVersionsOutputSchema,
  displayName: 'List Document Set Versions',
  description: 'Lists the captured versions of a document set in a document library.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the captured versions of a document set, with their IDs, comments and the item versions each one holds, one page at a time. Works only on a document set item in a library with the Document Sets feature enabled; List List Items returns the item ID.',
    idempotent: true,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    listId: microsoftSharePointAiProps.listId({ required: true }),
    listItemId: microsoftSharePointAiProps.listItemId({
      required: true,
      displayName: 'Document Set Item ID',
      description:
        'List item ID of the document set, a number like "12" sent as text. Use List List Items to find it.',
    }),
    limit: microsoftSharePointAiProps.limit({ required: false }),
    nextLink: microsoftSharePointAiProps.nextLink({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await microsoftSharePointClient.list<DocumentSetVersion>({
      auth,
      path: `/sites/${encodeURIComponent(propsValue.siteId)}/lists/${encodeURIComponent(propsValue.listId)}/items/${encodeURIComponent(propsValue.listItemId)}/documentSetVersions`,
      limit: propsValue.limit,
      nextLink: propsValue.nextLink,
    });
  },
});
