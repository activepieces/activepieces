import { createAction, Property } from '@activepieces/pieces-framework';
import type { ItemActivityStat } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharePointUtils } from '../../../common/utils';
import { microsoftSharepointGetSiteAnalyticsOutputSchema } from '../../../output-schemas';

export const getSiteAnalyticsAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_get_site_analytics',
  outputSchema: microsoftSharepointGetSiteAnalyticsOutputSchema,
  displayName: 'Get Site Analytics',
  description: 'Gets view counts for a SharePoint site.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets how many times a SharePoint site was viewed and by how many people, for all time or the last seven days. Use Get Site Activity Stats for a custom date range; Find Site, Get Root Site or Get Site by Path return the site ID.',
    idempotent: true,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    period: Property.StaticDropdown({
      displayName: 'Period',
      description: 'Time range of the stats: "allTime" or "lastSevenDays". Defaults to "allTime".',
      required: false,
      defaultValue: 'allTime',
      options: {
        disabled: false,
        options: [
          { label: 'All Time', value: 'allTime' },
          { label: 'Last Seven Days', value: 'lastSevenDays' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const stats: ItemActivityStat = await microsoftSharePointClient
      .create({ auth })
      .api(
        `/sites/${encodeURIComponent(propsValue.siteId)}/analytics/${microsoftSharePointUtils.analyticsPeriod({ value: propsValue.period })}`
      )
      .get();
    return stats;
  },
});
