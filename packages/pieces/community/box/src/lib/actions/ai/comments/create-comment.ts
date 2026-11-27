import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

const ITEM_TYPES = ['file', 'comment'];

export const createCommentAction = createAction({
  auth: boxAuth,
  name: 'box_create_comment',
  displayName: 'Create Comment',
  description: 'Adds a comment to a Box file, or a reply to a comment.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Posts a comment on a file, or a reply when Item Type is "comment". To mention a user, use Tagged Message with @[userId:name] instead of Message. Get comment IDs from List File Comments.',
    idempotent: false,
  },
  props: {
    itemId: Property.ShortText({
      displayName: 'Item ID',
      description: 'ID of the file to comment on, or of the comment to reply to.',
      required: true,
    }),
    itemType: Property.StaticDropdown({
      displayName: 'Item Type',
      description: '"file" for a new comment, "comment" for a reply.',
      required: true,
      options: { options: ITEM_TYPES.map((value) => ({ label: value, value })) },
    }),
    message: Property.LongText({
      displayName: 'Message',
      description: 'Comment text. Required unless Tagged Message is given.',
      required: false,
    }),
    taggedMessage: Property.LongText({
      displayName: 'Tagged Message',
      description: 'Comment text with mentions written as @[userId:name], e.g. "@[123:Jane] please review". Notifies those users.',
      required: false,
    }),
    fields: boxAiProps.fields({ required: false }),
  },
  async run({ auth, propsValue }) {
    if (!ITEM_TYPES.includes(propsValue.itemType)) {
      throw new Error(`Item Type must be one of: ${ITEM_TYPES.join(', ')}.`);
    }
    if (!propsValue.message && !propsValue.taggedMessage) {
      throw new Error('Give Message or Tagged Message.');
    }
    return await boxClient.request({
      auth,
      method: HttpMethod.POST,
      path: '/comments',
      query: { fields: propsValue.fields },
      body: {
        item: { id: propsValue.itemId, type: propsValue.itemType },
        ...(propsValue.message ? { message: propsValue.message } : {}),
        ...(propsValue.taggedMessage ? { tagged_message: propsValue.taggedMessage } : {}),
      },
    });
  },
});
