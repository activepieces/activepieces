import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharePointUtils } from '../../../common/utils';
import { microsoftSharepointAssociateContentTypeWithHubSitesOutputSchema } from '../../../output-schemas';

export const associateContentTypeWithHubSitesAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_associate_content_type_with_hub_sites',
  outputSchema: microsoftSharepointAssociateContentTypeWithHubSitesOutputSchema,
  displayName: 'Associate Content Type with Hub Sites',
  description: 'Enforces a Content Type Hub content type on hub sites.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Enforces one content type from the Content Type Hub site on the given hub sites, for new lists only or also for existing lists. Site ID must be the Content Type Hub site; List Content Types on it returns the content type IDs.',
    idempotent: true,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({
      required: true,
      description:
        'ID of the Content Type Hub site that owns the content type. Use Get Site by Path with "/sites/contentTypeHub" to find it.',
    }),
    contentTypeId: Property.ShortText({
      displayName: 'Content Type ID',
      description:
        'ID of the content type in the Content Type Hub, like "0x0101...". Use List Content Types on the hub site to find it.',
      required: true,
    }),
    hubSiteUrls: Property.Array({
      displayName: 'Hub Site URLs',
      description:
        'Canonical Microsoft Graph URLs of the hub sites, like "https://graph.microsoft.com/v1.0/sites/{site-id}".',
      required: true,
    }),
    propagateToExistingLists: Property.StaticDropdown({
      displayName: 'Propagate to Existing Lists',
      description:
        'Whether the content type is also enforced on existing lists in the hub sites. Leave empty to apply it to new lists only.',
      required: false,
      options: {
        options: [
          { label: 'True', value: 'true' },
          { label: 'False', value: 'false' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const hubSiteUrls = propsValue.hubSiteUrls.map((url) => String(url));
    if (hubSiteUrls.length === 0) {
      throw new Error('Hub Site URLs must hold at least one URL.');
    }
    const propagateToExistingLists = microsoftSharePointUtils.booleanChoice({
      value: propsValue.propagateToExistingLists,
      propName: 'Propagate to Existing Lists',
    });
    await microsoftSharePointClient
      .create({ auth })
      .api(
        `/sites/${encodeURIComponent(propsValue.siteId)}/contentTypes/${encodeURIComponent(propsValue.contentTypeId)}/associateWithHubSites`
      )
      .post({
        hubSiteUrls,
        ...(propagateToExistingLists !== undefined ? { propagateToExistingLists } : {}),
      });
    return { success: true, contentTypeId: propsValue.contentTypeId, hubSiteUrls };
  },
});
