import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { writesonicBulkAuth } from '../common/auth';
import {
  engineDropdownOptions,
  languageDropdownOptions,
  toneofvoiceDropdown,
} from '../common/props';
import { makeRequest } from '../common/client';

export const sentenceExpander = createAction({
  auth: writesonicBulkAuth,
  name: 'sentenceExpander',
  displayName: 'Sentence Expander',
  description:
    'Expand short sentences into more descriptive and interesting ones',
  props: {
    content_to_expand: Property.LongText({
      displayName: 'Sentence',
      description: 'The sentence you want to expand',
      required: true,
    }),
    tone_of_voice: toneofvoiceDropdown,
    keyword: Property.ShortText({
      displayName: 'Keyword',
      description: 'A keyword to include in the expanded sentence',
      required: false,
    }),
    engine: engineDropdownOptions,
    language: languageDropdownOptions,
    num_copies: Property.Number({
      displayName: 'Number of Copies',
      description: 'Number of blog ideas to generate (1-5)',
      required: true,
      defaultValue: 1,
    }),
  },
  async run(context) {
    const payload: any = {
      content_to_expand: context.propsValue.content_to_expand,
    };
    if (context.propsValue.tone_of_voice) {
      payload.tone_of_voice = context.propsValue.tone_of_voice;
    }
    if (context.propsValue.keyword) {
      payload.keyword = context.propsValue.keyword;
    }
    const queryParams = new URLSearchParams({
      engine: context.propsValue.engine,
      language: context.propsValue.language,
      num_copies: context.propsValue.num_copies.toString(),
    });
    const response = await makeRequest(
      context.auth,
      HttpMethod.POST,
      `/content/sentence-expand?${queryParams.toString()}`,
      payload
    );

    return response;
  },
});
