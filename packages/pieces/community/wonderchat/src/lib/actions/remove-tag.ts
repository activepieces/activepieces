import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wcRequest } from '../client';

export const removeTag = createAction({
  name: 'remove_tag',
  displayName: 'Remove Tag',
  description: 'Remove specific tags from a chatlog.',
  props: {
    chatlogId: Property.ShortText({
      displayName: 'Chatlog ID',
      required: true,
    }),
    tag: Property.ShortText({
      displayName: 'Tag',
      required: true,
    }),
  },
  async run(ctx) {
    const apiKey = ctx.auth as string;
    const { chatlogId, tag } = ctx.propsValue;

    // TODO: Verify endpoint and whether DELETE path encodes tag, or body is used.
    const result = await wcRequest<any>({
      apiKey,
      method: HttpMethod.DELETE,
      url: `/api/v1/chatlogs/${chatlogId}/tags/${encodeURIComponent(tag)}`, // TODO: confirm path
    });

    return result;
  },
});