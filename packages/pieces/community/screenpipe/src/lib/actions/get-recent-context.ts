import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { screenpipeAuth } from '../..';

export const getRecentContext = createAction({
  auth: screenpipeAuth,
  name: 'get_recent_context',
  displayName: 'Get Recent Context',
  description: 'Get the most recent screen and audio activity from Screenpipe',
  props: {
    minutes: Property.Number({
      displayName: 'Minutes',
      description: 'Number of minutes of recent activity to retrieve',
      required: false,
      defaultValue: 30,
    }),
    content_type: Property.StaticDropdown({
      displayName: 'Content Type',
      description: 'Type of content to retrieve',
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
      defaultValue: 20,
    }),
  },
  async run({ auth, propsValue }) {
    const baseUrl = auth.props.base_url.replace(/\/$/, '');
    const minutes = propsValue.minutes ?? 30;

    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - minutes * 60 * 1000);

    const queryParams: Record<string, string> = {
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
    };

    if (propsValue.content_type && propsValue.content_type !== 'all') {
      queryParams['content_type'] = propsValue.content_type;
    }
    if (propsValue.limit !== undefined && propsValue.limit !== null) {
      queryParams['limit'] = String(propsValue.limit);
    }

    const params = new URLSearchParams(queryParams).toString();

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${baseUrl}/search?${params}`,
    });

    return response.body;
  },
});
