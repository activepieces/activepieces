import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { greipAuth } from '../auth';
import { greipClient } from '../common/client';
import { greipProps } from '../common/props';

export const profanityDetectionAction = createAction({
  auth: greipAuth,
  name: 'profanity_detection',
  classification: 'READ',
  displayName: 'Detect Profanity',
  description: 'Detect offensive or inappropriate language in text using machine learning',
  audience: 'both',
  aiMetadata: { description: 'Scan a block of text for offensive or inappropriate language and return a risk/safety assessment. Can return just the score and safety flag, or additionally list the bad words found. Use to moderate user-generated content. Read-only scoring call; safe to repeat.', idempotent: true },
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
    mode: greipProps.mode({ required: false }),
    callback: greipProps.callback({ required: false }),
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

    return await greipClient.request({
      method: HttpMethod.GET,
      path: '/scoring/profanity',
      query: queryParams,
      auth: context.auth,
    });
  },
});

