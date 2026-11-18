import { createAction, Property } from '@activepieces/pieces-framework';
import type { DocumentSetVersion } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointCreateDocumentSetVersionOutputSchema } from '../../../output-schemas';

export const getDocumentSetVersionAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_get_document_set_version',
  outputSchema: microsoftSharepointCreateDocumentSetVersionOutputSchema,
  displayName: 'Get Document Set Version',
  description: 'Gets one captured version of a document set.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets one captured version of a document set with its comment, creator and the item versions it holds. List Document Set Versions returns the version IDs.',
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
    documentSetVersionId: Property.ShortText({
      displayName: 'Document Set Version ID',
      description:
        'ID of the document set version, like "1". Use List Document Set Versions to find it.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const version: DocumentSetVersion = await microsoftSharePointClient
      .create({ auth })
      .api(
        `/sites/${encodeURIComponent(propsValue.siteId)}/lists/${encodeURIComponent(propsValue.listId)}/items/${encodeURIComponent(propsValue.listItemId)}/documentSetVersions/${encodeURIComponent(propsValue.documentSetVersionId)}`
      )
      .get();
    return version;
  },
});
