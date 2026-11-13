import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointDeleteDocumentSetVersionOutputSchema } from '../../../output-schemas';

export const restoreDocumentSetVersionAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_restore_document_set_version',
  outputSchema: microsoftSharepointDeleteDocumentSetVersionOutputSchema,
  displayName: 'Restore Document Set Version',
  description: 'Restores a document set to one of its captured versions.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Restores a document set and the items it holds to one of its captured versions. List Document Set Versions returns the version IDs; capture the current state first with Create Document Set Version to be able to return to it.',
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
        'ID of the document set version to restore, like "1". Use List Document Set Versions to find it.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    await microsoftSharePointClient
      .create({ auth })
      .api(
        `/sites/${encodeURIComponent(propsValue.siteId)}/lists/${encodeURIComponent(propsValue.listId)}/items/${encodeURIComponent(propsValue.listItemId)}/documentSetVersions/${encodeURIComponent(propsValue.documentSetVersionId)}/restore`
      )
      .post(undefined);
    return {
      success: true,
      siteId: propsValue.siteId,
      listId: propsValue.listId,
      listItemId: propsValue.listItemId,
      documentSetVersionId: propsValue.documentSetVersionId,
    };
  },
});
