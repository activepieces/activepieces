import { createAction } from '@activepieces/pieces-framework';
import type { ColumnDefinition } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharePointColumnDefinition } from './column-definition';
import { microsoftSharepointGetListContentTypeColumnOutputSchema } from '../../../output-schemas';

export const getListContentTypeColumnAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_get_list_content_type_column',
  outputSchema: microsoftSharepointGetListContentTypeColumnOutputSchema,
  displayName: 'Get List Content Type Column',
  description: 'Gets one column of a list content type.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets the definition of one column of a list content type: its name, type and settings. List List Content Type Columns returns the column IDs.',
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
  },
  async run({ auth, propsValue }) {
    const column: ColumnDefinition = await microsoftSharePointClient
      .create({ auth })
      .api(
        `/sites/${encodeURIComponent(propsValue.siteId)}/lists/${encodeURIComponent(propsValue.listId)}/contentTypes/${encodeURIComponent(propsValue.contentTypeId)}/columns/${encodeURIComponent(propsValue.columnId)}`
      )
      .get();
    return column;
  },
});
