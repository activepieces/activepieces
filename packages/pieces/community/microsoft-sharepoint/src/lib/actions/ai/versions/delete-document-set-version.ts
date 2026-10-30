import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointDeleteDocumentSetVersionOutputSchema } from '../../../output-schemas';

export const deleteDocumentSetVersionAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_delete_document_set_version',
  outputSchema: microsoftSharepointDeleteDocumentSetVersionOutputSchema,
  displayName: 'Delete Document Set Version',
  description: 'Deletes a captured version of a document set.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes one captured version of a document set; the document set and its current items are not changed. List Document Set Versions returns the version IDs.',
    idempotent: false,
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
    documentSetVersionId: Property.ShortText({
      displayName: 'Document Set Version ID',
      description:
        'ID of the document set version to delete, like "1". Use List Document Set Versions to find it.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    await microsoftSharePointClient
      .create({ auth })
      .api(
        `/sites/${encodeURIComponent(propsValue.siteId)}/lists/${encodeURIComponent(propsValue.listId)}/items/${encodeURIComponent(propsValue.listItemId)}/documentSetVersions/${encodeURIComponent(propsValue.documentSetVersionId)}`
      )
      .delete();
    return {
      success: true,
      siteId: propsValue.siteId,
      listId: propsValue.listId,
      listItemId: propsValue.listItemId,
      documentSetVersionId: propsValue.documentSetVersionId,
    };
  },
});
