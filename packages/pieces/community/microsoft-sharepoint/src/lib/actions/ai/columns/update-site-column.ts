import { createAction } from '@activepieces/pieces-framework';
import type { ColumnDefinition } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharePointColumnDefinition } from './column-definition';
import { microsoftSharepointCreateSiteColumnOutputSchema } from '../../../output-schemas';

export const updateSiteColumnAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_update_site_column',
  outputSchema: microsoftSharepointCreateSiteColumnOutputSchema,
  displayName: 'Update Site Column',
  description: 'Updates a column of a SharePoint site.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes the name, description, flags or type settings of a column of a SharePoint site, sending only the fields given. Set Column Type to send Type Settings. List Site Columns returns the column IDs.',
    idempotent: true,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    columnId: microsoftSharePointColumnDefinition.columnId({
      description: 'ID of the site column. Use List Site Columns to find it.',
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
        `/sites/${encodeURIComponent(propsValue.siteId)}/columns/${encodeURIComponent(propsValue.columnId)}`
      )
      .patch(body);
    return column;
  },
});
