import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { writesonicBulkAuth } from '../common/auth';
import {
  engineDropdownOptions,
  languageDropdownOptions,
} from '../common/props';
import { makeRequest } from '../common/client';

export const blogIdeas = createAction({
  auth: writesonicBulkAuth,
  name: 'blogIdeas',
  displayName: 'Blog Ideas',
  description: 'Generate blog article ideas based on a topic or keyword',
  props: {
    topic: Property.ShortText({
      displayName: 'Topic',
      description: 'The topic or keyword to generate blog ideas for',
      required: true,
    }),
    keyword: Property.ShortText({
      displayName: 'Keyword',
      description: 'A keyword to include in the blog introduction',
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
      topic: context.propsValue.topic,
    };
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
      `/content/blog-ideas?${queryParams.toString()}`,
      payload
    );

    return response;
  },
});
