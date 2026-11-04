import { createAction } from '@activepieces/pieces-framework';
import type { ColumnDefinition } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharePointColumnDefinition } from './column-definition';
import { microsoftSharepointCreateListColumnOutputSchema } from '../../../output-schemas';

export const getListColumnAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_get_list_column',
  outputSchema: microsoftSharepointCreateListColumnOutputSchema,
  displayName: 'Get List Column',
  description: 'Gets one column of a SharePoint list.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets the definition of one column of a SharePoint list: its name, type and settings. List List Columns returns the column IDs.',
    idempotent: true,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    listId: microsoftSharePointAiProps.listId({ required: true }),
    columnId: microsoftSharePointColumnDefinition.columnId({
      description: 'ID of the list column. Use List List Columns to find it.',
    }),
  },
  async run({ auth, propsValue }) {
    const column: ColumnDefinition = await microsoftSharePointClient
      .create({ auth })
      .api(
        `/sites/${encodeURIComponent(propsValue.siteId)}/lists/${encodeURIComponent(propsValue.listId)}/columns/${encodeURIComponent(propsValue.columnId)}`
      )
      .get();
    return column;
  },
});
