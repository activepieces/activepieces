import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { writesonicBulkAuth } from '../common/auth';
import {
  engineDropdownOptions,
  languageDropdownOptions,
} from '../common/props';
import { makeRequest } from '../common/client';

export const contentShorten = createAction({
  auth: writesonicBulkAuth,
  name: 'contentShorten',
  displayName: 'Content Shorten',
  description:
    'Shorten your content in a different voice and style to appeal to different readers',
  props: {
    content_to_shorten: Property.LongText({
      displayName: 'Original Content',
      description: 'The content you want to shorten',
      required: true,
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
    const payload = {
      content_to_shorten: context.propsValue.content_to_shorten,
    };

    const queryParams = new URLSearchParams({
      engine: context.propsValue.engine,
      language: context.propsValue.language,
      num_copies: context.propsValue.num_copies.toString(),
    });
    const response = await makeRequest(
      context.auth,
      HttpMethod.POST,
      `/content/content-shorten?${queryParams.toString()}`,
      payload
    );

    return response;
  },
});
