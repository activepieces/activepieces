import { createAction } from '@activepieces/pieces-framework';
import type { ColumnDefinition } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharePointColumnDefinition } from './column-definition';
import { microsoftSharepointCreateListColumnOutputSchema } from '../../../output-schemas';

export const createListColumnAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_create_list_column',
  outputSchema: microsoftSharepointCreateListColumnOutputSchema,
  displayName: 'Create List Column',
  description: 'Creates a column in a SharePoint list.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a column of the given type in a SharePoint list, only for that list. Not idempotent: the name must be unique, so a repeat fails.',
    idempotent: false,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    listId: microsoftSharePointAiProps.listId({ required: true }),
    ...microsoftSharePointColumnDefinition.definitionProps({ required: true }),
  },
  async run({ auth, propsValue }) {
    const column: ColumnDefinition = await microsoftSharePointClient
      .create({ auth })
      .api(`/sites/${encodeURIComponent(propsValue.siteId)}/lists/${encodeURIComponent(propsValue.listId)}/columns`)
      .post(microsoftSharePointColumnDefinition.definitionBody({ values: propsValue }));
    return column;
  },
});
