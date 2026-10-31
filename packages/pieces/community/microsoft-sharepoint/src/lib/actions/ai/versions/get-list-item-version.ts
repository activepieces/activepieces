import { createAction, Property } from '@activepieces/pieces-framework';
import type { ListItemVersion } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointGetListItemVersionOutputSchema } from '../../../output-schemas';

export const getListItemVersionAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_get_list_item_version',
  outputSchema: microsoftSharepointGetListItemVersionOutputSchema,
  displayName: 'Get List Item Version',
  description: 'Gets one version of a SharePoint list item with its field values.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets one version of a SharePoint list item with the field values it had in that version. List List Item Versions returns the version IDs.',
    idempotent: true,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    listId: microsoftSharePointAiProps.listId({ required: true }),
    listItemId: microsoftSharePointAiProps.listItemId({ required: true }),
    versionId: Property.ShortText({
      displayName: 'Version ID',
      description:
        'ID of the list item version, like "1.0". Use List List Item Versions to find it.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const version: ListItemVersion = await microsoftSharePointClient
      .create({ auth })
      .api(
        `/sites/${encodeURIComponent(propsValue.siteId)}/lists/${encodeURIComponent(propsValue.listId)}/items/${encodeURIComponent(propsValue.listItemId)}/versions/${encodeURIComponent(propsValue.versionId)}`
      )
      .expand('fields')
      .get();
    return version;
  },
});
