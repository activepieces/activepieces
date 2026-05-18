import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { writesonicBulkAuth } from '../common/auth';
import {
  engineDropdownOptions,
  languageDropdownOptions,
} from '../common/props';
import { makeRequest } from '../common/client';

export const blogOutlines = createAction({
  auth: writesonicBulkAuth,
  name: 'blogOutlines',
  displayName: 'Blog Outlines',
  description: 'Generate detailed article outlines for better content writing',
  props: {
    blog_title: Property.ShortText({
      displayName: 'Blog Title',
      description: 'The blog topic or title to generate an outline for',
      required: true,
    }),
    blog_intro: Property.LongText({
      displayName: 'Blog Introduction',
      description: 'The introduction of the blog to base the outline on',
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
      blog_title: context.propsValue.blog_title,
      blog_intro: context.propsValue.blog_intro,
    };

    const queryParams = new URLSearchParams({
      engine: context.propsValue.engine,
      language: context.propsValue.language,
      num_copies: context.propsValue.num_copies.toString(),
    });

    const response = await makeRequest(
      context.auth,
      HttpMethod.POST,
      `/content/blog-outlines?${queryParams.toString()}`,
      payload
    );

    return response;
  },
});
