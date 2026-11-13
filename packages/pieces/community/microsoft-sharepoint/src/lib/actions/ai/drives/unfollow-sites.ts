import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharePointUtils } from '../../../common/utils';
import { microsoftSharepointUnfollowSitesOutputSchema } from '../../../output-schemas';

export const unfollowSitesAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_unfollow_sites',
  outputSchema: microsoftSharepointUnfollowSitesOutputSchema,
  displayName: 'Unfollow Sites',
  description: 'Stops following one or more SharePoint sites for the signed-in user.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Removes one or more SharePoint sites from the sites the signed-in user follows. If some sites fail, the error names the ones that failed and the rest are unfollowed. List Followed Sites returns the site IDs.',
    idempotent: true,
  },
  props: {
    siteIds: Property.Array({
      displayName: 'Site IDs',
      description:
        'IDs of the sites to unfollow, like "contoso.sharepoint.com,<guid>,<guid>". Use List Followed Sites to find them.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const siteIds = microsoftSharePointUtils.toSiteIds({ values: propsValue.siteIds });
    const response: UnfollowedSitesResponse | undefined = await microsoftSharePointClient
      .create({ auth })
      .api('/me/followedSites/remove')
      .post({ value: siteIds.map((id) => ({ id })) });
    const failed = (response?.value ?? []).filter((site) => site.error);
    if (failed.length > 0) {
      throw new Error(
        `Could not unfollow ${failed.length} of ${siteIds.length} sites: ${failed
          .map((site) => `${site.id} (${site.error?.message ?? site.error?.code})`)
          .join('; ')}. The other sites are no longer followed.`
      );
    }
    return { success: true, siteIds };
  },
});

type UnfollowedSitesResponse = {
  value?: { id?: string; error?: { code?: string; message?: string } }[];
};
