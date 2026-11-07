import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointCopyFileToDefaultContentLocationOutputSchema } from '../../../output-schemas';

export const deleteContentTypeAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_delete_content_type',
  outputSchema: microsoftSharepointCopyFileToDefaultContentLocationOutputSchema,
  displayName: 'Delete Content Type',
  description: 'Permanently deletes a content type from a SharePoint site.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes one site content type; it does not go to the recycle bin. List Content Types returns the content type IDs; use Delete List Content Type to remove one from a list.',
    idempotent: false,
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
    await microsoftSharePointClient
      .create({ auth })
      .api(
        `/sites/${encodeURIComponent(propsValue.siteId)}/contentTypes/${encodeURIComponent(propsValue.contentTypeId)}`
      )
      .delete();
    return { success: true, contentTypeId: propsValue.contentTypeId };
  },
});
