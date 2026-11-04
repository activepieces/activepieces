import { createAction, Property } from '@activepieces/pieces-framework';
import type { ColumnDefinition } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointListContentTypeColumnsOutputSchema } from '../../../output-schemas';

export const listContentTypeColumnsAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_list_content_type_columns',
  outputSchema: microsoftSharepointListContentTypeColumnsOutputSchema,
  displayName: 'List Content Type Columns',
  description: 'Lists the columns of a site content type.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the columns of one site content type with their IDs, names and types, one page at a time. List Content Types returns the content type IDs; use List List Content Type Columns for a content type attached to a list.',
    idempotent: true,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    contentTypeId: Property.ShortText({
      displayName: 'Content Type ID',
      description: 'ID of the site content type, like "0x0101...". Use List Content Types to find it.',
      required: true,
    }),
    limit: microsoftSharePointAiProps.limit({ required: false }),
    nextLink: microsoftSharePointAiProps.nextLink({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await microsoftSharePointClient.list<ColumnDefinition>({
      auth,
      path: `/sites/${encodeURIComponent(propsValue.siteId)}/contentTypes/${encodeURIComponent(propsValue.contentTypeId)}/columns`,
      limit: propsValue.limit,
      nextLink: propsValue.nextLink,
    });
  },
});
