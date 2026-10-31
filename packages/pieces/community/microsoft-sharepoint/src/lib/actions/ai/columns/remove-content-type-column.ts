import { createAction } from '@activepieces/pieces-framework';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharePointColumnDefinition } from './column-definition';
import { microsoftSharepointCheckInFileOutputSchema } from '../../../output-schemas';

export const removeContentTypeColumnAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_remove_content_type_column',
  outputSchema: microsoftSharepointCheckInFileOutputSchema,
  displayName: 'Remove Content Type Column',
  description: 'Removes a column from a site content type.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Removes a column from a site content type; the column itself stays in the site. Repeating it fails because the column is no longer in the content type. List Content Type Columns returns the column IDs.',
    idempotent: false,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    contentTypeId: microsoftSharePointColumnDefinition.contentTypeId({
      description: 'ID of the site content type, like "0x0101". Use List Content Types to find it.',
    }),
    columnId: microsoftSharePointColumnDefinition.columnId({
      description: 'ID of the column in the content type. Use List Content Type Columns to find it.',
    }),
  },
  async run({ auth, propsValue }) {
    await microsoftSharePointClient
      .create({ auth })
      .api(
        `/sites/${encodeURIComponent(propsValue.siteId)}/contentTypes/${encodeURIComponent(propsValue.contentTypeId)}/columns/${encodeURIComponent(propsValue.columnId)}`
      )
      .delete();
    return { success: true };
  },
});
