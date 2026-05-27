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
      required: true,
    }),
    byID: Property.ShortText({
      displayName: 'By ID',
      description: 'The unique identifier of the admin creating the post on behalf of the author.',
      required: false,
    }),
    categoryID: Property.ShortText({
      displayName: 'Category ID',
      description: 'The unique identifier of the category to assign.',
      required: false,
    }),
    ownerID: Property.ShortText({
      displayName: 'Owner ID',
      description: 'The unique identifier of the user responsible for completing the work.',
      required: false,
    }),
    eta: Property.ShortText({
      displayName: 'ETA',
      description: 'The estimated delivery date in MM/YYYY format (e.g. "06/2026").',
      required: false,
    }),
    etaPublic: Property.Checkbox({
      displayName: 'ETA Public',
      description: 'Whether the ETA should be visible to all users.',
      required: false,
    }),
    customFields: Property.Object({
      displayName: 'Custom Fields',
      description: 'Custom fields as key-value pairs (keys max 30 chars, values max 200 chars).',
      required: false,
    }),
    createdAt: Property.ShortText({
      displayName: 'Created At',
      description: 'Original creation date in ISO 8601 format, for migrating posts from another source.',
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
        byID: propsValue.byID,
        categoryID: propsValue.categoryID,
        ownerID: propsValue.ownerID,
        eta: propsValue.eta,
        etaPublic: propsValue.etaPublic,
        customFields: propsValue.customFields,
        createdAt: propsValue.createdAt,
      }),
    });
  },
});
