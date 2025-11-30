import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { writesonicBulkAuth } from '../common/auth';
import {
  engineDropdownOptions,
  languageDropdownOptions,
  toneofvoiceDropdown,
} from '../common/props';
import { makeRequest } from '../common/client';

export const contentRephraser = createAction({
  auth: writesonicBulkAuth,
  name: 'contentRephraser',
  displayName: 'Content Rephraser',
  description:
    'Rephrase content in a different voice and style to appeal to different readers',
  props: {
    content_to_rephrase: Property.LongText({
      displayName: 'Original Content',
      description: 'The content you want to rephrase',
      required: true,
    }),
    tone_of_voice: toneofvoiceDropdown,
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
      content_to_rephrase: context.propsValue.content_to_rephrase,
    };
    if (context.propsValue.tone_of_voice) {
      payload.tone_of_voice = context.propsValue.tone_of_voice;
    }
    const queryParams = new URLSearchParams({
      engine: context.propsValue.engine,
      language: context.propsValue.language,
      num_copies: context.propsValue.num_copies.toString(),
    });

    const response = await makeRequest(
      context.auth,
      HttpMethod.POST,
      `/content/content-rephrases?${queryParams.toString()}`,
      payload
    );

    return response;
  },
});
