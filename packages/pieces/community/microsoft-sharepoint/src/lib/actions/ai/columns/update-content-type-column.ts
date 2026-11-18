import { createAction } from '@activepieces/pieces-framework';
import type { ColumnDefinition } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharePointColumnDefinition } from './column-definition';
import { microsoftSharepointAddContentTypeColumnOutputSchema } from '../../../output-schemas';

export const updateContentTypeColumnAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_update_content_type_column',
  outputSchema: microsoftSharepointAddContentTypeColumnOutputSchema,
  displayName: 'Update Content Type Column',
  description: 'Updates a column of a site content type.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes whether a column of a site content type is required or hidden, sending only the fields given; other column settings can only be changed on the site or list column. List Content Type Columns returns the column IDs.',
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
    ...microsoftSharePointColumnDefinition.flagProps(),
  },
  async run({ auth, propsValue }) {
    const body = microsoftSharePointColumnDefinition.requireChanges({
      body: microsoftSharePointColumnDefinition.flagBody({ values: propsValue }),
    });
    const column: ColumnDefinition = await microsoftSharePointClient
      .create({ auth })
      .api(
        `/sites/${encodeURIComponent(propsValue.siteId)}/contentTypes/${encodeURIComponent(propsValue.contentTypeId)}/columns/${encodeURIComponent(propsValue.columnId)}`
      )
      .patch(body);
    return column;
  },
});
