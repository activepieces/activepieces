import { createAction } from '@activepieces/pieces-framework';
import type { DriveItem } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointListCompatibleHubContentTypesOutputSchema } from '../../../output-schemas';

export const listFollowedFilesAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_list_followed_files',
  outputSchema: microsoftSharepointListCompatibleHubContentTypesOutputSchema,
  displayName: 'List Followed Files',
  description: 'Lists the files and folders the signed-in user follows.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      "Lists the files and folders the signed-in user follows, one page at a time; each item's remoteItem holds its real drive and item IDs. Needs the user's OneDrive to be provisioned; Follow Drive Item adds to this list.",
    idempotent: true,
  },
  props: {
    limit: microsoftSharePointAiProps.limit({ required: false }),
    nextLink: microsoftSharePointAiProps.nextLink({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await microsoftSharePointClient.list<DriveItem>({
      auth,
      path: '/me/drive/following',
      limit: propsValue.limit,
      nextLink: propsValue.nextLink,
    });
  },
});
