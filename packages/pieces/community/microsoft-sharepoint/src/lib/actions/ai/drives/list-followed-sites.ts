import { createAction } from '@activepieces/pieces-framework';
import type { Site } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointListFollowedSitesOutputSchema } from '../../../output-schemas';

export const listFollowedSitesAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_list_followed_sites',
  outputSchema: microsoftSharepointListFollowedSitesOutputSchema,
  displayName: 'List Followed Sites',
  description: 'Lists the SharePoint sites the signed-in user follows.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the SharePoint sites the signed-in user follows with their IDs, names and URLs, one page at a time. Use Find Site to search all sites; Follow Sites and Unfollow Sites change this list.',
    idempotent: true,
  },
  props: {
    limit: microsoftSharePointAiProps.limit({ required: false }),
    nextLink: microsoftSharePointAiProps.nextLink({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await microsoftSharePointClient.list<Site>({
      auth,
      path: '/me/followedSites',
      limit: propsValue.limit,
      nextLink: propsValue.nextLink,
    });
  },
});
