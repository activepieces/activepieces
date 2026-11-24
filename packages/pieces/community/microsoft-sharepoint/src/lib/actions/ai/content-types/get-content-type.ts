import { createAction, Property } from '@activepieces/pieces-framework';
import type { ContentType } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointCreateContentTypeOutputSchema } from '../../../output-schemas';

export const getContentTypeAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_get_content_type',
  outputSchema: microsoftSharepointCreateContentTypeOutputSchema,
  displayName: 'Get Content Type',
  description: 'Gets one content type of a SharePoint site.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets one site content type by ID, with its name, group, parent and base content type. List Content Types returns the content type IDs; use Get List Content Type for a content type attached to a list.',
    idempotent: true,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    contentTypeId: Property.ShortText({
      displayName: 'Content Type ID',
      description: 'ID of the site content type, like "0x0101...". Use List Content Types to find it.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const contentType: ContentType = await microsoftSharePointClient
      .create({ auth })
      .api(
        `/sites/${encodeURIComponent(propsValue.siteId)}/contentTypes/${encodeURIComponent(propsValue.contentTypeId)}`
      )
      .get();
    return contentType;
  },
});
