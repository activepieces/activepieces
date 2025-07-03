import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, QueryParams, httpClient } from '@activepieces/pieces-common';
import { supadataAuth } from '../..';
import { supadataConfig } from '../config';

export const getTranscriptAction = createAction({
  name: 'get_transcript',
  displayName: 'Get Transcript',
  description: 'Fetches transcript of a YouTube video.',
  auth: supadataAuth,
  props: {
    url: Property.ShortText({
      displayName: 'YouTube URL',
      description: 'The URL of a single YouTube video.',
      required: true,
    }),
    lang: Property.ShortText({
      displayName: 'Language Preference',
      description: 'Preferred language of the transcript. If not available, the first available language will be returned.',
      required: false,
    }),
    text: Property.Checkbox({
      displayName: 'Merge Text',
      description: 'If true, the transcript will be merged into a single text instead of timestamped chunks.',
      required: false,
      defaultValue: true,
    })
  },
  async run(context) {
    const { url, text, lang } = context.propsValue;
    const qs:QueryParams = {
      url,
      text: text ? 'true' : 'false',
    }

    if (lang) {
      qs['lang'] = lang;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${supadataConfig.baseUrl}/youtube/transcript`,
      headers: {
        [supadataConfig.accessTokenHeaderKey]: context.auth,
      },
      queryParams: qs,
    });

    return response.body;
  },
}); 