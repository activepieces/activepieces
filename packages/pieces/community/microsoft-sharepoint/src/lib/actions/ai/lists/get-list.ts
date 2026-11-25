import { createAction } from '@activepieces/pieces-framework';
import type { List } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointGetListOutputSchema } from '../../../output-schemas';

export const getListAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_get_list',
  outputSchema: microsoftSharepointGetListOutputSchema,
  displayName: 'Get List',
  description: 'Gets a SharePoint list by its ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets one SharePoint list with its name, display name, template, URL and dates. List Lists returns the list IDs; use List List Items to read its items.',
    idempotent: true,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    listId: microsoftSharePointAiProps.listId({ required: true }),
  },
  async run({ auth, propsValue }) {
    const list: List = await microsoftSharePointClient
      .create({ auth })
      .api(
        `/sites/${encodeURIComponent(propsValue.siteId)}/lists/${encodeURIComponent(propsValue.listId)}`
      )
      .get();
    return list;
  },
});
