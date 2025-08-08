import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { shortIoApiCall } from '../common/client';
import { shortIoAuth } from '../common/auth';
import { domainIdDropdown } from '../common/props';

export const getLinkClicksAction = createAction({
  auth: shortIoAuth,
  name: 'get-link-clicks',
  displayName: 'Get Link Clicks',
  description: 'Retrieve click statistics for specific short links by their IDs.',
  props: {
    domain: {
      ...domainIdDropdown,
      required: true,
      description: 'Select the domain containing the links',
    },
    ids: Property.Array({
      displayName: 'Link IDs',
      description: 'List of link IDs to fetch click statistics for (e.g., lnk_61Mb_0dnRUg3vvtmAPZh3dhQh6).',
      required: true,
    }),
    startDate: Property.DateTime({
      displayName: 'Start Date',
      description: 'Start date for click statistics (optional).',
      required: false,
    }),
    endDate: Property.DateTime({
      displayName: 'End Date',
      description: 'End date for click statistics (optional).',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const { domain: domainString, ids, startDate, endDate } = propsValue;

    if (!domainString) {
      throw new Error('Domain is required. Please select a domain.');
    }

    if (!ids || ids.length === 0) {
      throw new Error('At least one Link ID is required.');
    }

    if ((startDate && !endDate) || (!startDate && endDate)) {
      throw new Error('Both Start Date and End Date must be provided if using a date range filter.');
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (start >= end) {
        throw new Error('Start date must be before end date.');
      }
    }

    const domainObject = JSON.parse(domainString as string);

    const query: Record<string, string> = {
      ids: (ids as string[]).join(','),
    };

    if (startDate && endDate) {
      query['startDate'] = new Date(startDate).toISOString().split('T')[0]; // YYYY-MM-DD format
      query['endDate'] = new Date(endDate).toISOString().split('T')[0];
    }

    try {
      const response = await shortIoApiCall({
        method: HttpMethod.GET,
        auth,
        url: `https://statistics.short.io/statistics/domain/${domainObject.id}/link_clicks`,
        query,
      });

      const linkCount = ids.length;
      const dateRange = startDate && endDate ? ` for ${query['startDate']} to ${query['endDate']}` : '';

      return {
        success: true,
        message: `Retrieved click statistics for ${linkCount} link${linkCount > 1 ? 's' : ''}${dateRange}`,
        data: response,
      };
    } catch (error: any) {
      if (error.message.includes('400')) {
        throw new Error(
          'Invalid request parameters. Please check your link IDs and date range.'
        );
      }
      
      if (error.message.includes('401') || error.message.includes('403')) {
        throw new Error(
          'Authentication failed or insufficient permissions. Please check your API key and domain access.'
        );
      }
      
      if (error.message.includes('404')) {
        throw new Error(
          'Domain or links not found. Please verify the domain and link IDs exist.'
        );
      }
      
      if (error.message.includes('429')) {
        throw new Error(
          'Rate limit exceeded. Please wait a moment before trying again.'
        );
      }

      throw new Error(`Failed to retrieve link click statistics: ${error.message}`);
    }
  },
});
