import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { screenpipeAuth } from '../..';

export const searchContent = createAction({
  auth: screenpipeAuth,
  name: 'search_content',
  displayName: 'Search Content',
  description: 'Query screen and audio capture history from Screenpipe',
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Text to search for in screen captures and audio transcriptions',
      required: true,
    }),
    content_type: Property.StaticDropdown({
      displayName: 'Content Type',
      description: 'Type of content to search',
      required: false,
      defaultValue: 'all',
      options: {
        disabled: false,
        options: [
          { value: 'all', label: 'All' },
          { value: 'ocr', label: 'Screen Text (OCR)' },
          { value: 'audio', label: 'Audio Transcription' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of results to return',
      required: false,
      defaultValue: 10,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of results to skip (for pagination)',
      required: false,
      defaultValue: 0,
    }),
    start_time: Property.ShortText({
      displayName: 'Start Time',
      description: 'Filter results after this time (ISO 8601 format, e.g. 2024-01-01T00:00:00Z)',
      required: false,
    }),
    end_time: Property.ShortText({
      displayName: 'End Time',
      description: 'Filter results before this time (ISO 8601 format)',
      required: false,
    }),
    app_name: Property.ShortText({
      displayName: 'App Name',
      description: 'Filter by application name',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const baseUrl = auth.props.base_url.replace(/\/$/, '');
    const query = propsValue.query?.trim();

    if (!query) {
      throw new Error('Search Query is required.');
    }

    const queryParams: Record<string, string> = { q: query };
    if (propsValue.content_type && propsValue.content_type !== 'all') {
      queryParams['content_type'] = propsValue.content_type;
    }
    if (propsValue.limit !== undefined && propsValue.limit !== null) {
      queryParams['limit'] = String(propsValue.limit);
    }
    if (propsValue.offset !== undefined && propsValue.offset !== null) {
      queryParams['offset'] = String(propsValue.offset);
    }
    if (propsValue.start_time) queryParams['start_time'] = propsValue.start_time;
    if (propsValue.end_time) queryParams['end_time'] = propsValue.end_time;
    if (propsValue.app_name) queryParams['app_name'] = propsValue.app_name;

    const params = new URLSearchParams(queryParams).toString();

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${baseUrl}/search${params ? '?' + params : ''}`,
    });

    return response.body;
  },
});
