import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { shortIoApiCall } from '../common/client';
import { shortIoAuth } from '../common/auth';
import { domainIdDropdown } from '../common/props';

export const getLinkClicksAction = createAction({
  auth: shortIoAuth,
  name: 'get-link-clicks',
  displayName: 'Get Link Clicks',
  description: 'Retrieve click statistics for specific short links by link ID.',
  props: {
    domainId: domainIdDropdown,
    ids: Property.Array({
      displayName: 'Link ID List',
      description: 'Comma-separated list of link IDs to fetch click stats for.',
      required: true,
    }),
    startDate: Property.ShortText({
      displayName: 'Start Date',
      description: 'Start date in YYYY-MM-DD format (required if you are specifying a custom range).',
      required: false,
    }),
    endDate: Property.ShortText({
      displayName: 'End Date',
      description: 'End date in YYYY-MM-DD format (required if you are specifying a custom range).',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const { domainId: domainString, ids, startDate, endDate } = propsValue;

    if ((startDate && !endDate) || (!startDate && endDate)) {
      throw new Error('Both startDate and endDate must be provided if using a custom date range.');
    }
    
    if (!domainString) {
        throw new Error('Domain is a required field.');
    }

    const domainObject = JSON.parse(domainString as string);

    const query: Record<string, string> = {
      ids: (ids as string[]).join(','),
    };

    if (startDate && endDate) {
      query['startDate'] = startDate;
      query['endDate'] = endDate;
    }

    try {
      const response = await shortIoApiCall({
        method: HttpMethod.GET,
        auth,
        url: `https://statistics.short.io/statistics/domain/${domainObject.id}/link_clicks`,
        query,
      });

      return {
        success: true,
        message: 'Link click statistics retrieved successfully.',
        data: response,
      };
    } catch (error: any) {
      throw new Error(`Failed to retrieve link click statistics: ${error.message}`);
    }
  },
});
