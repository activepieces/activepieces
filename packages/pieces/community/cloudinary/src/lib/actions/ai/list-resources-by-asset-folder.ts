import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest, ResourceList } from '../../common/client';
import { aiProps, aiResults } from '../../common/ai-props';
import { cloudinaryListResourcesByAssetFolderOutputSchema } from '../../output-schemas';

export const cloudinaryListResourcesByAssetFolder = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_list_resources_by_asset_folder',
  outputSchema: cloudinaryListResourcesByAssetFolderOutputSchema,
  displayName: 'List Resources by Asset Folder',
  description: 'Lists the assets stored in an asset folder.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the assets placed directly in an asset folder (dynamic folder mode), across all resource types unless one is given. Folder paths come from List Root Folders or List Subfolders. On fixed-folder accounts, use List Resources with a public ID prefix instead. Pages with next_cursor.',
    idempotent: true,
  },
  props: {
    asset_folder: Property.ShortText({
      displayName: 'Asset Folder',
      description: 'Full folder path (e.g. "marketing/banners").',
      required: true,
    }),
    resource_type: aiProps.resourceType({ required: false }),
    direction: aiProps.direction(),
    max_results: aiProps.maxResults(),
    next_cursor: aiProps.nextCursor(),
  },
  async run({ auth, propsValue }) {
    const response: ResourceList = await makeRequest(auth, HttpMethod.GET, '/resources/by_asset_folder', undefined, {
        asset_folder: propsValue.asset_folder.trim(),
        resource_type: propsValue.resource_type,
        direction: propsValue.direction,
        max_results: aiResults.clampMaxResults({ value: propsValue.max_results }),
        next_cursor: propsValue.next_cursor,
      });
    return aiResults.toResourceList({ response });
  },
});
