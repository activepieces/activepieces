import { createAction, Property } from '@activepieces/pieces-framework';
import type { ContentType } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointAddContentTypeToListOutputSchema } from '../../../output-schemas';

export const addContentTypeToListAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_add_content_type_to_list',
  outputSchema: microsoftSharepointAddContentTypeToListOutputSchema,
  displayName: 'Add Content Type to List',
  description: 'Adds a copy of a site content type to a SharePoint list.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Attaches a copy of a site content type to one list or document library. List Applicable Content Types returns the content types that fit the list; use Add Hub Content Type to List for a Content Type Hub content type.',
    idempotent: false,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    listId: microsoftSharePointAiProps.listId({ required: true }),
    contentTypeId: Property.ShortText({
      displayName: 'Content Type ID',
      description:
        'ID of the site content type to add, like "0x0101...". Use List Applicable Content Types or List Content Types to find it.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const siteId = encodeURIComponent(propsValue.siteId);
    const contentType: ContentType = await microsoftSharePointClient
      .create({ auth })
      .api(`/sites/${siteId}/lists/${encodeURIComponent(propsValue.listId)}/contentTypes/addCopy`)
      .post({
        contentType: `${microsoftSharePointClient.baseUrl({ auth })}/v1.0/sites/${siteId}/contentTypes/${encodeURIComponent(propsValue.contentTypeId)}`,
      });
    return contentType;
  },
});
