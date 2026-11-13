import { createAction, Property } from '@activepieces/pieces-framework';
import type { ListItem } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharePointUtils } from '../../../common/utils';
import { microsoftSharepointGetListItemChangesOutputSchema } from '../../../output-schemas';

export const getListItemChangesAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_get_list_item_changes',
  outputSchema: microsoftSharepointGetListItemChangesOutputSchema,
  displayName: 'Get List Item Changes',
  description: 'Gets the items of a SharePoint list that were added, changed or deleted.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Tracks changes to the items of a SharePoint list, one page at a time. The first call returns every item; pass @odata.nextLink back while it is present, then keep @odata.deltaLink and pass it later to get only the items added, changed or deleted since. List Lists returns the list IDs.',
    idempotent: true,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    listId: microsoftSharePointAiProps.listId({ required: true }),
    includeFields: Property.StaticDropdown({
      displayName: 'Include Column Values',
      description: 'Whether to return the column values (fields) of each item. Defaults to true.',
      required: false,
      options: {
        options: [
          { label: 'Yes', value: 'true' },
          { label: 'No', value: 'false' },
        ],
      },
    }),
    limit: microsoftSharePointAiProps.limit({ required: false }),
    nextLink: microsoftSharePointAiProps.nextLink({
      required: false,
      displayName: 'Next or Delta Link',
      description:
        'The @odata.nextLink or @odata.deltaLink value from the previous call. Leave empty to start tracking from the full list.',
    }),
  },
  async run({ auth, propsValue }) {
    const includeFields = microsoftSharePointUtils.booleanChoice({
      value: propsValue.includeFields,
      propName: 'Include Column Values',
    });
    return await microsoftSharePointClient.list<ListItem>({
      auth,
      path: `/sites/${encodeURIComponent(propsValue.siteId)}/lists/${encodeURIComponent(propsValue.listId)}/items/delta`,
      limit: propsValue.limit,
      nextLink: propsValue.nextLink,
      query: includeFields === false ? {} : { $expand: 'fields' },
    });
  },
});
