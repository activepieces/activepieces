import { createAction, Property } from '@activepieces/pieces-framework';
import { tldvAuth } from '../../index';
import { HttpMethod } from '@activepieces/pieces-common';
import { tldvCommon } from '../common/client';

export const listMeetings = createAction({
  auth: tldvAuth,
  name: 'list_meetings',
  displayName: 'List Meetings',
  description: 'Search and list meetings',
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Search for meetings by name or content',
      required: false,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number to return (default: 1)',
      required: false,
      defaultValue: 1,
    }),
    limit: Property.Number({
      displayName: 'Results Per Page',
      description: 'Number of results per page (default: 50)',
      required: false,
      defaultValue: 50,
    }),
    from: Property.DateTime({
      displayName: 'From Date',
      description: 'Search meetings from this date',
      required: false,
    }),
    to: Property.DateTime({
      displayName: 'To Date',
      description: 'Search meetings up to this date',
      required: false,
    }),
    onlyParticipated: Property.Checkbox({
      displayName: 'Only Participated',
      description: 'Only return meetings you participated in',
      required: false,
      defaultValue: false,
    }),
    meetingType: Property.StaticDropdown({
      displayName: 'Meeting Type',
      description: 'Filter by meeting type',
      required: false,
      options: {
        options: [
          { label: 'All', value: '' },
          { label: 'Internal', value: 'internal' },
          { label: 'External', value: 'external' },
        ],
      },
    }),
  },
  async run(context) {
    const { query, page, limit, from, to, onlyParticipated, meetingType } = context.propsValue;

    const params = new URLSearchParams();

    if (query) {
      params.append('query', query);
    }
    if (page) {
      params.append('page', page.toString());
    }
    if (limit) {
      params.append('limit', limit.toString());
    }
    if (from) {
      params.append('from', new Date(from).toISOString());
    }
    if (to) {
      params.append('to', new Date(to).toISOString());
    }
    if (onlyParticipated !== undefined) {
      params.append('onlyParticipated', onlyParticipated.toString());
    }
    if (meetingType) {
      params.append('meetingType', meetingType);
    }

    const queryString = params.toString();
    const url = `/v1alpha1/meetings${queryString ? `?${queryString}` : ''}`;

    const response = await tldvCommon.apiCall<{
      page: number;
      pages: number;
      total: number;
      pageSize: number;
      results: any[];
    }>({
      method: HttpMethod.GET,
      url,
      auth: { apiKey: context.auth.secret_text },
    });

    return response;
  },
});

