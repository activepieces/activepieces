import { createAction, Property } from '@activepieces/pieces-framework';
import type { ItemActivityStat } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointApi } from '../../../common/api';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharePointUtils } from '../../../common/utils';
import { microsoftSharepointGetFileActivityStatsOutputSchema } from '../../../output-schemas';

export const getListItemActivityStatsAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_get_list_item_activity_stats',
  outputSchema: microsoftSharepointGetFileActivityStatsOutputSchema,
  displayName: 'Get List Item Activity Stats',
  description: 'Gets activity counts for an item in a SharePoint list per day, week or month.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets activity counts (views, edits, deletes and more, with action and actor counts) on a SharePoint list item for each day, week or month in a date range, one page of intervals at a time. Daily counts cover at most 90 days. Use Get List Item Analytics for all-time or last-seven-days totals. Takes the numeric item ID from List List Items (or the listItemUniqueId GUID) and looks up the GUID that analytics needs.',
    idempotent: true,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    listId: microsoftSharePointAiProps.listId({ required: true }),
    listItemId: microsoftSharePointAiProps.listItemId({ required: true }),
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
    const uniqueId = await microsoftSharePointApi.listItemUniqueId({
      auth,
      siteId: propsValue.siteId,
      listId: propsValue.listId,
      listItemId: propsValue.listItemId,
    });
    return await microsoftSharePointClient.list<ItemActivityStat>({
      auth,
      path: `/sites/${encodeURIComponent(propsValue.siteId)}/lists/${encodeURIComponent(propsValue.listId)}/items/${encodeURIComponent(uniqueId)}/${microsoftSharePointUtils.activitiesByIntervalFunction({
        startDateTime: propsValue.startDateTime,
        endDateTime: propsValue.endDateTime,
        interval: propsValue.interval,
      })}`,
      limit: propsValue.limit,
      nextLink: propsValue.nextLink,
    });
  },
});
