import { HttpMethod, httpClient, propsValidation } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import * as z from 'zod/mini';
import { googleAuth } from '../..';
import { getPostActionOutputSchema } from '../output-schemas';
import { localPostUtils } from '../common/local-post';

export const getPost = createAction({
  name: 'get-post',
  outputSchema: getPostActionOutputSchema,
  classification: 'READ',
  displayName: 'Get Post',
  description: 'Retrieves a single post by its resource name.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches one local post from a Google Business Profile location by its full resource name, in the form accounts/{account}/locations/{location}/localPosts/{post}. Use List Posts or Create Post to obtain that name. Read-only and safe to repeat.',
    idempotent: true,
  },
  auth: googleAuth,
  props: {
    postName: Property.ShortText({
      displayName: 'Post Name',
      description:
        'Full resource name of the post, as `accounts/{account}/locations/{location}/localPosts/{post}`. List Posts and Create Post both return it as `name`.',
      required: true,
    }),
  },
  async run(ctx) {
    const { postName } = ctx.propsValue;

    await propsValidation.validateZod(ctx.propsValue, {
      postName: z.string().check(z.regex(localPostUtils.postNamePattern)),
    });

    const response = await httpClient.sendRequest({
      url: `${localPostUtils.baseUrl}/${postName}`,
      method: HttpMethod.GET,
      headers: {
        Authorization: `Bearer ${ctx.auth.access_token}`,
      },
    });

    return response.body;
  },
});
