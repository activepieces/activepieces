import { createAction, Property } from '@activepieces/pieces-framework';
import type { ColumnDefinition } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointAddContentTypeColumnOutputSchema } from '../../../output-schemas';

export const addContentTypeColumnAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_add_content_type_column',
  outputSchema: microsoftSharepointAddContentTypeColumnOutputSchema,
  displayName: 'Add Content Type Column',
  description: 'Adds an existing site column to a site content type.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Adds an existing site column to one site content type. List Content Types returns the content type IDs and List Site Columns the column IDs; use Add List Content Type Column for a content type attached to a list.',
    idempotent: false,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    contentTypeId: Property.ShortText({
      displayName: 'Content Type ID',
      description: 'ID of the site content type, like "0x0101...". Use List Content Types to find it.',
      required: true,
    }),
    columnId: Property.ShortText({
      displayName: 'Column ID',
      description: 'ID of the site column to add (a GUID). Use List Site Columns to find it.',
      required: true,
    }),
    columnSiteId: microsoftSharePointAiProps.siteId({
      required: false,
      displayName: 'Column Site ID',
      description:
        'ID of the site that defines the column, when it is a parent or root site rather than Site ID. Leave empty to use Site ID.',
    }),
  },
  async run({ auth, propsValue }) {
    const columnSiteId = propsValue.columnSiteId ?? propsValue.siteId;
    const column: ColumnDefinition = await microsoftSharePointClient
      .create({ auth })
      .api(
        `/sites/${encodeURIComponent(propsValue.siteId)}/contentTypes/${encodeURIComponent(propsValue.contentTypeId)}/columns`
      )
      .post({
        'sourceColumn@odata.bind': `${microsoftSharePointClient.baseUrl({ auth })}/v1.0/sites/${encodeURIComponent(columnSiteId)}/columns/${encodeURIComponent(propsValue.columnId)}`,
      });
    return column;
  },
});
