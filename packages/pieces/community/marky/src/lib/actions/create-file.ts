import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { markyAuth } from '../auth';
import { markyCommon } from '../common/client';
import { markyProps } from '../common/props';

export const createFileAction = createAction({
  auth: markyAuth,
  name: 'create_file',
  displayName: 'Create File',
  description: "Create a markdown document in a business's library.",
  audience: 'both',
  aiMetadata: {
    description:
      'Store written content (a blog post, notes, a brief) as a markdown document in a Marky business library, where it becomes context for post generation. Use Upload Media for images and videos instead. Each call creates a new document, so retries duplicate.',
    idempotent: false,
  },
  props: {
    businessId: markyProps.businessId,
    path: Property.ShortText({
      displayName: 'Path',
      description: "Where to store the document in the library, e.g. '/documents/my-notes'.",
      required: true,
    }),
    content: Property.LongText({
      displayName: 'Content',
      description: 'The markdown content of the document.',
      required: true,
    }),
  },
  async run(context) {
    const { businessId, path, content } = context.propsValue;

    const response = await markyCommon.apiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/businesses/${businessId}/library/files`,
      body: { path, content },
    });

    return response.body;
  },
});
