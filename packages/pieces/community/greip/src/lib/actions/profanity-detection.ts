import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { greipAuth } from '../common/auth';
import { greipApiCall } from '../common/client';

export const profanityDetection = createAction({
  auth: greipAuth,
  name: 'profanity_detection',
  displayName: 'Detect Profanity',
  description: 'Detect offensive or inappropriate language in text using machine learning',
  props: {
    text: Property.LongText({
      displayName: 'Text',
      description: 'The text to check for profanity',
      required: true,
    }),
    scoreOnly: Property.StaticDropdown({
      displayName: 'Score Only',
      description: 'Return only the score and safety status',
      required: false,
      defaultValue: 'no',
      options: {
        options: [
          { label: 'No', value: 'no' },
          { label: 'Yes', value: 'yes' },
        ],
      },
    }),
    listBadWords: Property.StaticDropdown({
      displayName: 'List Bad Words',
      description: 'Include a list of bad words found in the text',
      required: false,
      defaultValue: 'no',
      options: {
        options: [
          { label: 'No', value: 'no' },
          { label: 'Yes', value: 'yes' },
        ],
      },
    }),
    format: Property.StaticDropdown({
      displayName: 'Response Format',
      description: 'Format of the response',
      required: false,
      defaultValue: 'JSON',
      options: {
        options: [
          { label: 'JSON', value: 'JSON' },
          { label: 'XML', value: 'XML' },
          { label: 'CSV', value: 'CSV' },
        ],
      },
    }),
    mode: Property.StaticDropdown({
      displayName: 'Environment',
      description: 'Environment mode for testing or production',
      required: false,
      defaultValue: 'live',
      options: {
        options: [
          { label: 'Live', value: 'live' },
          { label: 'Test', value: 'test' },
        ],
      },
    }),
    callback: Property.ShortText({
      displayName: 'JSONP Callback',
      description: 'Function name for JSONP response format',
      required: false,
    }),
  },
  async run(context) {
    const { text, scoreOnly, listBadWords, format, mode, callback } = context.propsValue;

    const queryParams: Record<string, string> = {
      text: text,
    };

    if (scoreOnly) {
      queryParams['scoreOnly'] = scoreOnly;
    }

    if (listBadWords) {
      queryParams['listBadWords'] = listBadWords;
    }

    if (format) {
      queryParams['format'] = format;
    }

    if (mode) {
      queryParams['mode'] = mode;
    }

    if (callback) {
      queryParams['callback'] = callback;
    }

    return await greipApiCall({
      method: HttpMethod.GET,
      path: '/scoring/profanity',
      queryParams,
      auth: context.auth,
    });
  },
});

