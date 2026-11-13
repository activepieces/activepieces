import { createAction, Property } from '@activepieces/pieces-framework';
import type { ItemActivityStat } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharePointUtils } from '../../../common/utils';
import { microsoftSharepointGetFileAnalyticsOutputSchema } from '../../../output-schemas';

export const getFileAnalyticsAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_get_file_analytics',
  outputSchema: microsoftSharepointGetFileAnalyticsOutputSchema,
  displayName: 'Get File Analytics',
  description: 'Gets view counts for a file or folder in a SharePoint document library.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets how many times a file or folder was viewed and by how many people, for all time or the last seven days. Use Get File Activity Stats for a custom date range; List Folder Children, Find File or Search return the item ID.',
    idempotent: true,
  },
  props: {
    driveId: microsoftSharePointAiProps.driveId({ required: true }),
    itemId: microsoftSharePointAiProps.itemId({ required: true }),
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
        `/drives/${encodeURIComponent(propsValue.driveId)}/items/${encodeURIComponent(propsValue.itemId)}/analytics/${microsoftSharePointUtils.analyticsPeriod({ value: propsValue.period })}`
      )
      .get();
    return stats;
  },
});
