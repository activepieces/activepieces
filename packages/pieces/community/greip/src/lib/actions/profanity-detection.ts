import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { greipAuth } from '../auth';
import { greipClient } from '../common/client';
import { greipProps } from '../common/props';
import { greipDetectProfanityOutputSchema } from '../output-schemas';

export const profanityDetectionAction = createAction({
  auth: greipAuth,
  name: 'profanity_detection',
  outputSchema: greipDetectProfanityOutputSchema,
  classification: 'READ',
  displayName: 'Detect Profanity',
  description: 'Detect offensive or inappropriate language in text using machine learning',
  audience: 'human',
  props: {
    text: Property.LongText({
      displayName: 'Text',
      description: 'The text to check for profanity',
      required: true,
    }),
    scoreOnly: Property.StaticDropdown({
      displayName: 'Score Only',
      description: 'Legacy option: Greip API v2 ignores it and always returns the risk level and recommendation.',
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
      description: 'Legacy option: Greip API v2 ignores it and does not return a bad-word list.',
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

    const body: Record<string, string> = {
      text: text,
    };

    if (scoreOnly) {
      body['scoreOnly'] = scoreOnly;
    }

    if (listBadWords) {
      body['listBadWords'] = listBadWords;
    }

    if (format) {
      body['format'] = format;
    }

    if (mode) {
      body['mode'] = mode;
    }

    return await greipClient.request({
      method: HttpMethod.POST,
      path: '/score/text',
      query: callback ? { callback } : undefined,
      body,
      auth: context.auth,
    });
  },
});

