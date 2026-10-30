import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointCopyFileToDefaultContentLocationOutputSchema } from '../../../output-schemas';

export const deleteListContentTypeAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_delete_list_content_type',
  outputSchema: microsoftSharepointCopyFileToDefaultContentLocationOutputSchema,
  displayName: 'Delete List Content Type',
  description: 'Removes a content type from a SharePoint list.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently removes one content type from a SharePoint list; the site content type it came from stays. List List Content Types returns the content type IDs.',
    idempotent: false,
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
    await microsoftSharePointClient
      .create({ auth })
      .api(
        `/sites/${encodeURIComponent(propsValue.siteId)}/lists/${encodeURIComponent(propsValue.listId)}/contentTypes/${encodeURIComponent(propsValue.contentTypeId)}`
      )
      .delete();
    return { success: true, contentTypeId: propsValue.contentTypeId };
  },
});
