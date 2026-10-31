import { createAction } from '@activepieces/pieces-framework';
import type { ColumnDefinition } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharePointColumnDefinition } from './column-definition';
import { microsoftSharepointCreateSiteColumnOutputSchema } from '../../../output-schemas';

export const createSiteColumnAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_create_site_column',
  outputSchema: microsoftSharepointCreateSiteColumnOutputSchema,
  displayName: 'Create Site Column',
  description: 'Creates a column in a SharePoint site.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a column of the given type in a SharePoint site, reusable by its lists and content types. Not idempotent: the name must be unique, so a repeat fails.',
    idempotent: false,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    ...microsoftSharePointColumnDefinition.definitionProps({ required: true }),
  },
  async run({ auth, propsValue }) {
    const column: ColumnDefinition = await microsoftSharePointClient
      .create({ auth })
      .api(`/sites/${encodeURIComponent(propsValue.siteId)}/columns`)
      .post(microsoftSharePointColumnDefinition.definitionBody({ values: propsValue }));
    return column;
  },
});
