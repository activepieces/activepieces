import { createAction, Property } from '@activepieces/pieces-framework';
import type { ItemActivityStat } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharePointUtils } from '../../../common/utils';
import { microsoftSharepointGetFileActivityStatsOutputSchema } from '../../../output-schemas';

export const getFileActivityStatsAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_get_file_activity_stats',
  outputSchema: microsoftSharepointGetFileActivityStatsOutputSchema,
  displayName: 'Get File Activity Stats',
  description: 'Gets activity counts for a file or folder per day, week or month.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets activity counts (views, edits, deletes and more, with action and actor counts) on a file or folder for each day, week or month in a date range, one page of intervals at a time. Daily counts cover at most 90 days. Use Get File Analytics for all-time or last-seven-days totals; List Folder Children, Find File or Search return the item ID.',
    idempotent: true,
  },
  props: {
    driveId: microsoftSharePointAiProps.driveId({ required: true }),
    itemId: microsoftSharePointAiProps.itemId({ required: true }),
    startDateTime: Property.ShortText({
      displayName: 'Start Date Time',
      description: 'Start of the range, as an ISO 8601 date or date-time like "2026-01-01" or "2026-01-01T00:00:00Z".',
      required: true,
    }),
    endDateTime: Property.ShortText({
      displayName: 'End Date Time',
      description: 'End of the range, as an ISO 8601 date or date-time like "2026-01-31" or "2026-01-31T00:00:00Z".',
      required: true,
    }),
    interval: Property.StaticDropdown({
      displayName: 'Interval',
      description: 'Length of each aggregation bucket: "day", "week" or "month".',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Day', value: 'day' },
          { label: 'Week', value: 'week' },
          { label: 'Month', value: 'month' },
        ],
      },
    }),
    limit: microsoftSharePointAiProps.limit({ required: false }),
    nextLink: microsoftSharePointAiProps.nextLink({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await microsoftSharePointClient.list<ItemActivityStat>({
      auth,
      path: `/drives/${encodeURIComponent(propsValue.driveId)}/items/${encodeURIComponent(propsValue.itemId)}/${microsoftSharePointUtils.activitiesByIntervalFunction({
        startDateTime: propsValue.startDateTime,
        endDateTime: propsValue.endDateTime,
        interval: propsValue.interval,
      })}`,
      limit: propsValue.limit,
      nextLink: propsValue.nextLink,
    });
  },
});
