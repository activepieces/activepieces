import { createAction } from '@activepieces/pieces-framework';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharePointColumnDefinition } from './column-definition';
import { microsoftSharepointCheckInFileOutputSchema } from '../../../output-schemas';

export const deleteSiteColumnAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_delete_site_column',
  outputSchema: microsoftSharepointCheckInFileOutputSchema,
  displayName: 'Delete Site Column',
  description: 'Deletes a column from a SharePoint site.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes a column from a SharePoint site; lists and content types using it lose it. Cannot be undone, and repeating it fails because the column is gone. List Site Columns returns the column IDs.',
    idempotent: false,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    columnId: microsoftSharePointColumnDefinition.columnId({
      description: 'ID of the site column. Use List Site Columns to find it.',
    }),
  },
  async run({ auth, propsValue }) {
    await microsoftSharePointClient
      .create({ auth })
      .api(
        `/sites/${encodeURIComponent(propsValue.siteId)}/columns/${encodeURIComponent(propsValue.columnId)}`
      )
      .delete();
    return { success: true };
  },
});
