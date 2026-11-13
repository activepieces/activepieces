import { createAction, Property } from '@activepieces/pieces-framework';
import type { ContentType } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharePointUtils } from '../../../common/utils';
import { microsoftSharepointAddHubContentTypeOutputSchema } from '../../../output-schemas';

export const addHubContentTypeToSiteAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_add_hub_content_type_to_site',
  outputSchema: microsoftSharepointAddHubContentTypeOutputSchema,
  displayName: 'Add Hub Content Type to Site',
  description: 'Adds or syncs a Content Type Hub content type to a SharePoint site.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Adds or syncs a content type published in the Content Type Hub to a site. It may finish at once (status completed, with the content type) or run in the background for up to 70 minutes (status inProgress): then poll Get Site Operation with the returned operationId. List Compatible Hub Content Types returns the content type IDs.',
    idempotent: false,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    contentTypeId: Property.ShortText({
      displayName: 'Hub Content Type ID',
      description: 'ID of the content type in the Content Type Hub, like "0x0101...". Use List Compatible Hub Content Types to find it.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await microsoftSharePointClient.postForLocation({
      auth,
      path: `/sites/${encodeURIComponent(propsValue.siteId)}/contentTypes/addCopyFromContentTypeHub`,
      body: { contentTypeId: propsValue.contentTypeId },
    });
    const operationLocation = response.location;
    const operationId = microsoftSharePointUtils.operationIdFromLocation({ location: operationLocation });
    if (response.status === 202) {
      return { status: 'inProgress', contentType: null, operationId, operationLocation };
    }
    const contentType: ContentType = JSON.parse(response.body);
    return { status: 'completed', contentType, operationId, operationLocation };
  },
});
