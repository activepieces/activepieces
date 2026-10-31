import { createAction, Property } from '@activepieces/pieces-framework';
import type { ContentType } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointGetListContentTypeOutputSchema } from '../../../output-schemas';

export const getListContentTypeAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_get_list_content_type',
  outputSchema: microsoftSharepointGetListContentTypeOutputSchema,
  displayName: 'Get List Content Type',
  description: 'Gets one content type attached to a SharePoint list.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets one content type attached to a SharePoint list by ID, with its name, group, parent and base content type. List List Content Types returns the content type IDs.',
    idempotent: true,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    listId: microsoftSharePointAiProps.listId({ required: true }),
    contentTypeId: Property.ShortText({
      displayName: 'Content Type ID',
      description:
        'ID of the content type in the list, like "0x0101...". Use List List Content Types to find it.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const contentType: ContentType = await microsoftSharePointClient
      .create({ auth })
      .api(
        `/sites/${encodeURIComponent(propsValue.siteId)}/lists/${encodeURIComponent(propsValue.listId)}/contentTypes/${encodeURIComponent(propsValue.contentTypeId)}`
      )
      .get();
    return contentType;
  },
});
