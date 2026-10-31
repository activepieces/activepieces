import { createAction } from '@activepieces/pieces-framework';
import type { ColumnDefinition } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharePointColumnDefinition } from './column-definition';
import { microsoftSharepointGetContentTypeColumnOutputSchema } from '../../../output-schemas';

export const getContentTypeColumnAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_get_content_type_column',
  outputSchema: microsoftSharepointGetContentTypeColumnOutputSchema,
  displayName: 'Get Content Type Column',
  description: 'Gets one column of a site content type.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets the definition of one column of a site content type: its name, type and settings. List Content Type Columns returns the column IDs.',
    idempotent: true,
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
    const column: ColumnDefinition = await microsoftSharePointClient
      .create({ auth })
      .api(
        `/sites/${encodeURIComponent(propsValue.siteId)}/contentTypes/${encodeURIComponent(propsValue.contentTypeId)}/columns/${encodeURIComponent(propsValue.columnId)}`
      )
      .get();
    return column;
  },
});
