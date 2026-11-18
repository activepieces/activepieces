import { createAction } from '@activepieces/pieces-framework';
import type { ColumnDefinition } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharePointColumnDefinition } from './column-definition';
import { microsoftSharepointCreateSiteColumnOutputSchema } from '../../../output-schemas';

export const getSiteColumnAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_get_site_column',
  outputSchema: microsoftSharepointCreateSiteColumnOutputSchema,
  displayName: 'Get Site Column',
  description: 'Gets one column of a SharePoint site.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets the definition of one column of a SharePoint site: its name, type and settings. List Site Columns returns the column IDs.',
    idempotent: true,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    columnId: microsoftSharePointColumnDefinition.columnId({
      description: 'ID of the site column. Use List Site Columns to find it.',
    }),
  },
  async run({ auth, propsValue }) {
    const column: ColumnDefinition = await microsoftSharePointClient
      .create({ auth })
      .api(
        `/sites/${encodeURIComponent(propsValue.siteId)}/columns/${encodeURIComponent(propsValue.columnId)}`
      )
      .get();
    return column;
  },
});
