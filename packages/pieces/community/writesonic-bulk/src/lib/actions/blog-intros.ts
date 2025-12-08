import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { writesonicBulkAuth } from '../common/auth';
import { engineDropdownOptions } from '../common/props';
import { languageDropdownOptions } from '../common/props';
import { makeRequest } from '../common/client';

export const blogIntros = createAction({
  auth: writesonicBulkAuth,
  name: 'blogIntros',
  displayName: 'Blog Intros',
  description: 'Generate enticing blog article introductions',
  props: {
    blog_title: Property.ShortText({
      displayName: 'Blog title',
      description: 'The blog topic or title to generate an introduction for',
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
    const payload: any = {
      blog_title: context.propsValue.blog_title,
    };
    const queryParams = new URLSearchParams({
      engine: context.propsValue.engine,
      language: context.propsValue.language,
      num_copies: context.propsValue.num_copies.toString(),
    });
    const response = await makeRequest(
      context.auth,
      HttpMethod.POST,
      `/content/blog-intros?${queryParams.toString()}`,
      payload
    );

    return response;
  },
});
