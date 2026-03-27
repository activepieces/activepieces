import { createAction, Property } from '@activepieces/pieces-framework';

import { cannyAuth } from '../auth';
import { boardIdProp } from '../common/props';
import { cannyRequest, cleanBody } from '../common/client';

export const createPostAction = createAction({
  auth: cannyAuth,
  name: 'create_post',
  displayName: 'Create Post',
  description: 'Creates a new post on a Canny board.',
  props: {
    boardID: boardIdProp,
    authorID: Property.ShortText({
      displayName: 'Author ID',
      description: 'The unique identifier of the post author (Canny user ID).',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'A brief title describing the post.',
      required: true,
    }),
    details: Property.LongText({
      displayName: 'Details',
      description: 'The longer description of the post.',
      required: false,
    }),
    categoryID: Property.ShortText({
      displayName: 'Category ID',
      description: 'The unique identifier of the category to assign.',
      required: false,
    }),
    eta: Property.ShortText({
      displayName: 'ETA',
      description: 'The estimated delivery month and year (e.g. "March 2026").',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return await cannyRequest({
      apiKey: auth.secret_text,
      path: '/posts/create',
      body: cleanBody({
        authorID: propsValue.authorID,
        boardID: propsValue.boardID,
        title: propsValue.title,
        details: propsValue.details,
        categoryID: propsValue.categoryID,
        eta: propsValue.eta,
      }),
    });
  },
});
