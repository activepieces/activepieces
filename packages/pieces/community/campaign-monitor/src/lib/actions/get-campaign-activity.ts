import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { clampPage, clampPageSize, makeRequest } from '../common/client';
import { campaignMonitorAuth } from '../auth';
import { clientId, sentCampaignId } from '../common/props';
import { campaignActivityOutputSchema } from '../output-schemas';

export const getCampaignActivityAction = createAction({
  auth: campaignMonitorAuth,
  name: 'get_campaign_activity',
  classification: 'SEARCH',
  displayName: 'Get Campaign Activity',
  description: 'Returns one page of recipients, opens, clicks or bounces.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns one page of per-subscriber activity for a sent Campaign Monitor campaign. Activity Type picks the report: recipients (who it was sent to), opens, clicks (with the clicked URL), bounces (with bounce type and reason) or unsubscribes. Since Date limits opens, clicks, bounces and unsubscribes to events on or after that day and is ignored for recipients. The output includes PageNumber, NumberOfPages and TotalNumberOfRecords; request the next Page to read further. Page size is clamped to 10-1000. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: campaignActivityOutputSchema,
  props: {
    clientId: clientId,
    campaignId: sentCampaignId,
    activityType: Property.StaticDropdown({
      displayName: 'Activity Type',
      required: true,
      defaultValue: 'opens',
      options: {
        options: [
          { label: 'Recipients', value: 'recipients' },
          { label: 'Opens', value: 'opens' },
          { label: 'Clicks', value: 'clicks' },
          { label: 'Bounces', value: 'bounces' },
          { label: 'Unsubscribes', value: 'unsubscribes' },
        ],
      },
    }),
    sinceDate: Property.DateTime({
      displayName: 'Since Date',
      description:
        'Only activity on or after this day. Ignored for recipients.',
      required: false,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number to return, starting at 1.',
      required: false,
      defaultValue: 1,
    }),
    pageSize: Property.Number({
      displayName: 'Page Size',
      description: 'Records per page, between 10 and 1000.',
      required: false,
      defaultValue: 100,
    }),
    orderDirection: Property.StaticDropdown({
      displayName: 'Order Direction',
      required: false,
      defaultValue: 'desc',
      options: {
        options: [
          { label: 'Newest first', value: 'desc' },
          { label: 'Oldest first', value: 'asc' },
        ],
      },
    }),
  },
  async run({ propsValue, auth }) {
    const activityType = propsValue.activityType;
    if (!ACTIVITY_TYPES.includes(activityType)) {
      throw new Error(`Unsupported activity type: ${activityType}`);
    }
    const query = new URLSearchParams({
      page: String(clampPage(propsValue.page)),
      pagesize: String(clampPageSize(propsValue.pageSize)),
      orderdirection: propsValue.orderDirection ?? 'desc',
    });
    if (activityType === 'recipients') {
      query.set('orderfield', 'email');
    } else {
      query.set('orderfield', 'date');
      if (propsValue.sinceDate) {
        query.set('date', toApiDate(propsValue.sinceDate));
      }
    }
    const response = await makeRequest({
      auth: { apiKey: auth.secret_text },
      method: HttpMethod.GET,
      path: `/campaigns/${
        propsValue.campaignId
      }/${activityType}.json?${query.toString()}`,
    });
    return response.body;
  },
});

const ACTIVITY_TYPES = [
  'recipients',
  'opens',
  'clicks',
  'bounces',
  'unsubscribes',
];

function toApiDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${value}`);
  }
  return date.toISOString().slice(0, 10);
}
