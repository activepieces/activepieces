import { createAction, Property } from '@activepieces/pieces-framework';
import type { Site } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharePointUtils } from '../../../common/utils';
import { microsoftSharepointFollowSitesOutputSchema } from '../../../output-schemas';

export const followSitesAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_follow_sites',
  outputSchema: microsoftSharepointFollowSitesOutputSchema,
  displayName: 'Follow Sites',
  description: 'Follows one or more SharePoint sites for the signed-in user.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Adds one or more SharePoint sites to the sites the signed-in user follows, shown by List Followed Sites. If some sites fail, the error names the ones that failed and the rest stay followed. Find Site returns site IDs; Unfollow Sites reverses it.',
    idempotent: true,
  },
  props: {
    siteIds: Property.Array({
      displayName: 'Site IDs',
      description:
        'IDs of the sites to follow, like "contoso.sharepoint.com,<guid>,<guid>". Use Find Site or Get Site by Path to find them.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const siteIds = microsoftSharePointUtils.toSiteIds({ values: propsValue.siteIds });
    const response: FollowedSitesResponse = await microsoftSharePointClient
      .create({ auth })
      .api('/me/followedSites/add')
      .post({ value: siteIds.map((id) => ({ id })) });
    const failed = (response.value ?? []).filter((site) => site.error);
    if (failed.length > 0) {
      throw new Error(
        `Could not follow ${failed.length} of ${siteIds.length} sites: ${failed
          .map((site) => `${site.id} (${site.error?.message ?? site.error?.code})`)
          .join('; ')}. The other sites are now followed.`
      );
    }
    return response;
  },
});

type FollowedSitesResponse = {
  value?: (Site & { error?: { code?: string; message?: string } })[];
};
