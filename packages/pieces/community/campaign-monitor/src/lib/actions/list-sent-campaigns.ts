import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { clampPage, clampPageSize, makeRequest } from '../common/client';
import { campaignMonitorAuth } from '../auth';
import { clientId } from '../common/props';
import { listCampaignsOutputSchema } from '../output-schemas';

export const listSentCampaignsAction = createAction({
  auth: campaignMonitorAuth,
  name: 'list_sent_campaigns',
  classification: 'SEARCH',
  displayName: 'List Sent Campaigns',
  description: 'Returns one page of campaigns a client has sent.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns one page of sent campaigns for a Campaign Monitor client (ID, name, subject, sender, sent date, recipient count, web version links), optionally limited to a sent-date range (To date exclusive) and to campaigns with given tags. The output includes PageNumber, NumberOfPages and TotalNumberOfRecords; request the next Page to read further. Page size is clamped to 10-1000. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: listCampaignsOutputSchema,
  props: {
    clientId: clientId,
    sentFromDate: Property.DateTime({
      displayName: 'Sent From Date',
      description: 'Only campaigns sent on or after this date.',
      required: false,
    }),
    sentToDate: Property.DateTime({
      displayName: 'Sent To Date',
      description:
        'Only campaigns sent before this date (the date itself is excluded).',
      required: false,
    }),
    tags: Property.ShortText({
      displayName: 'Tags',
      description: 'Only campaigns with these tags, as a comma-separated list.',
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
      description: 'Campaigns per page, between 10 and 1000.',
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
    const query = new URLSearchParams({
      page: String(clampPage(propsValue.page)),
      pagesize: String(clampPageSize(propsValue.pageSize)),
      orderdirection: propsValue.orderDirection ?? 'desc',
    });
    if (propsValue.sentFromDate) {
      query.set('sentfromdate', toApiDate(propsValue.sentFromDate));
    }
    if (propsValue.sentToDate) {
      query.set('senttodate', toApiDate(propsValue.sentToDate));
    }
    const tags = propsValue.tags
      ?.split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
    if (tags && tags.length > 0) {
      query.set('tags', tags.join(','));
    }
    const response = await makeRequest({
      auth: { apiKey: auth.secret_text },
      method: HttpMethod.GET,
      path: `/clients/${
        propsValue.clientId
      }/campaigns.json?${query.toString()}`,
    });
    return response.body;
  },
});

function toApiDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${value}`);
  }
  return date.toISOString().slice(0, 10);
}
