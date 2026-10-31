import { createAction } from '@activepieces/pieces-framework';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharePointColumnDefinition } from './column-definition';
import { microsoftSharepointCheckInFileOutputSchema } from '../../../output-schemas';

export const deleteListColumnAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_delete_list_column',
  outputSchema: microsoftSharepointCheckInFileOutputSchema,
  displayName: 'Delete List Column',
  description: 'Deletes a column from a SharePoint list.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes a column from a SharePoint list, including the values stored in it. Cannot be undone, and repeating it fails because the column is gone. List List Columns returns the column IDs.',
    idempotent: false,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    listId: microsoftSharePointAiProps.listId({ required: true }),
    columnId: microsoftSharePointColumnDefinition.columnId({
      description: 'ID of the list column. Use List List Columns to find it.',
    }),
  },
  async run({ auth, propsValue }) {
    await microsoftSharePointClient
      .create({ auth })
      .api(
        `/sites/${encodeURIComponent(propsValue.siteId)}/lists/${encodeURIComponent(propsValue.listId)}/columns/${encodeURIComponent(propsValue.columnId)}`
      )
      .delete();
    return { success: true };
  },
});
