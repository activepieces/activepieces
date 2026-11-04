import { createAction, Property } from '@activepieces/pieces-framework';
import type { ColumnDefinition } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointListListContentTypeColumnsOutputSchema } from '../../../output-schemas';

export const listListContentTypeColumnsAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_list_list_content_type_columns',
  outputSchema: microsoftSharepointListListContentTypeColumnsOutputSchema,
  displayName: 'List List Content Type Columns',
  description: 'Lists the columns of a content type attached to a SharePoint list.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the columns of one content type attached to a SharePoint list, with their IDs, names and types, one page at a time. List List Content Types returns the content type IDs.',
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
    limit: microsoftSharePointAiProps.limit({ required: false }),
    nextLink: microsoftSharePointAiProps.nextLink({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await microsoftSharePointClient.list<ColumnDefinition>({
      auth,
      path: `/sites/${encodeURIComponent(propsValue.siteId)}/lists/${encodeURIComponent(propsValue.listId)}/contentTypes/${encodeURIComponent(propsValue.contentTypeId)}/columns`,
      limit: propsValue.limit,
      nextLink: propsValue.nextLink,
    });
  },
});
