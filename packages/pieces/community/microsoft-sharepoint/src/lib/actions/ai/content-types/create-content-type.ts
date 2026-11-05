import { createAction, Property } from '@activepieces/pieces-framework';
import type { ContentType } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointCreateContentTypeOutputSchema } from '../../../output-schemas';

export const createContentTypeAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_create_content_type',
  outputSchema: microsoftSharepointCreateContentTypeOutputSchema,
  displayName: 'Create Content Type',
  description: 'Creates a content type in a SharePoint site.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a site content type that inherits from a base content type, such as Item (0x01), Document (0x0101) or Document Set (0x0120D520). List Content Types returns base content type IDs; use Add Content Type to List to attach the new one to a list.',
    idempotent: false,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Name of the new content type.',
      required: true,
    }),
    group: Property.ShortText({
      displayName: 'Group',
      description: 'Group to list the content type under, like "Custom Content Types".',
      required: true,
    }),
    baseContentTypeId: Property.ShortText({
      displayName: 'Base Content Type ID',
      description:
        'ID of the content type to inherit from, like "0x0101" for Document. Use List Content Types to find it.',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Description of the content type.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const body: ContentType = {
      name: propsValue.name,
      group: propsValue.group,
      base: { id: propsValue.baseContentTypeId },
      ...(propsValue.description !== undefined ? { description: propsValue.description } : {}),
    };
    const contentType: ContentType = await microsoftSharePointClient
      .create({ auth })
      .api(`/sites/${encodeURIComponent(propsValue.siteId)}/contentTypes`)
      .post(body);
    return contentType;
  },
});
