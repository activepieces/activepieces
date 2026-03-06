import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { screenpipeAuth } from '../auth';
import { screenpipeApiRequest } from '../common';

export const searchContent = createAction({
  auth: screenpipeAuth,
  name: 'search_content',
  displayName: 'Search Content',
  description:
    'Search captured screen and audio content using full-text search',
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description:
        'Full-text search query. Supports phrases, prefix matching, and boolean operators.',
      required: false,
    }),
    contentType: Property.StaticDropdown({
      displayName: 'Content Type',
      description: 'Type of content to search',
      required: false,
      defaultValue: 'all',
      options: {
        disabled: false,
        options: [
          { label: 'All', value: 'all' },
          { label: 'Screen (OCR)', value: 'ocr' },
          { label: 'Audio', value: 'audio' },
          { label: 'UI Elements', value: 'ui' },
        ],
      },
    }),
    appName: Property.ShortText({
      displayName: 'Application Name',
      description: 'Filter by application name',
      required: false,
    }),
    windowName: Property.ShortText({
      displayName: 'Window Name',
      description: 'Filter by window title',
      required: false,
    }),
    startTime: Property.DateTime({
      displayName: 'Start Time',
      description: 'Filter results after this time',
      required: false,
    }),
    endTime: Property.DateTime({
      displayName: 'End Time',
      description: 'Filter results before this time',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of results (default: 20, max: 500)',
      required: false,
      defaultValue: 20,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Pagination offset',
      required: false,
      defaultValue: 0,
    }),
  },
  async run(context) {
    const queryParams: Record<string, string> = {};

    if (context.propsValue.query) {
      queryParams['q'] = context.propsValue.query;
    }
    if (context.propsValue.contentType) {
      queryParams['content_type'] = context.propsValue.contentType;
    }
    if (context.propsValue.appName) {
      queryParams['app_name'] = context.propsValue.appName;
    }
    if (context.propsValue.windowName) {
      queryParams['window_name'] = context.propsValue.windowName;
    }
    if (context.propsValue.startTime) {
      queryParams['start_time'] = context.propsValue.startTime;
    }
    if (context.propsValue.endTime) {
      queryParams['end_time'] = context.propsValue.endTime;
    }
    if (context.propsValue.limit) {
      queryParams['limit'] = String(context.propsValue.limit);
    }
    if (context.propsValue.offset) {
      queryParams['offset'] = String(context.propsValue.offset);
    }

    return await screenpipeApiRequest({
      auth: context.auth,
      method: HttpMethod.GET,
      endpoint: '/search',
      queryParams,
    });
  },
});
