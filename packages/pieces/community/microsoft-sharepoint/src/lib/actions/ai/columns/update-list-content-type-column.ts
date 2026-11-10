import { createAction } from '@activepieces/pieces-framework';
import type { ColumnDefinition } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharePointColumnDefinition } from './column-definition';
import { microsoftSharepointAddListContentTypeColumnOutputSchema } from '../../../output-schemas';

export const updateListContentTypeColumnAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_update_list_content_type_column',
  outputSchema: microsoftSharepointAddListContentTypeColumnOutputSchema,
  displayName: 'Update List Content Type Column',
  description: 'Updates a column of a list content type.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes whether a column of a list content type is required or hidden, sending only the fields given; other column settings can only be changed on the site or list column. List List Content Type Columns returns the column IDs.',
    idempotent: true,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    listId: microsoftSharePointAiProps.listId({ required: true }),
    contentTypeId: microsoftSharePointColumnDefinition.contentTypeId({
      description: 'ID of the list content type, like "0x0100...". Use List List Content Types to find it.',
    }),
    columnId: microsoftSharePointColumnDefinition.columnId({
      description: 'ID of the column in the list content type. Use List List Content Type Columns to find it.',
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
        `/sites/${encodeURIComponent(propsValue.siteId)}/lists/${encodeURIComponent(propsValue.listId)}/contentTypes/${encodeURIComponent(propsValue.contentTypeId)}/columns/${encodeURIComponent(propsValue.columnId)}`
      )
      .patch(body);
    return column;
  },
});
