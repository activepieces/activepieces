import { createAction } from '@activepieces/pieces-framework';
import type { ColumnDefinition } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharePointColumnDefinition } from './column-definition';
import { microsoftSharepointCreateListColumnOutputSchema } from '../../../output-schemas';

export const updateListColumnAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_update_list_column',
  outputSchema: microsoftSharepointCreateListColumnOutputSchema,
  displayName: 'Update List Column',
  description: 'Updates a column of a SharePoint list.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes the name, description, flags or type settings of a column of a SharePoint list, sending only the fields given. Set Column Type to send Type Settings. List List Columns returns the column IDs.',
    idempotent: true,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    listId: microsoftSharePointAiProps.listId({ required: true }),
    columnId: microsoftSharePointColumnDefinition.columnId({
      description: 'ID of the list column. Use List List Columns to find it.',
    }),
    ...microsoftSharePointColumnDefinition.definitionProps({ required: false }),
  },
  async run({ auth, propsValue }) {
    const body = microsoftSharePointColumnDefinition.requireChanges({
      body: microsoftSharePointColumnDefinition.definitionBody({ values: propsValue }),
    });
    const column: ColumnDefinition = await microsoftSharePointClient
      .create({ auth })
      .api(
        `/sites/${encodeURIComponent(propsValue.siteId)}/lists/${encodeURIComponent(propsValue.listId)}/columns/${encodeURIComponent(propsValue.columnId)}`
      )
      .patch(body);
    return column;
  },
});
