import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wcRequest } from '../client';

export const addTag = createAction({
  name: 'add_tag',
  displayName: 'Add Tag',
  description: 'Add custom tags to a specific chatlog.',
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

    // TODO: Verify endpoint and payload with Wonderchat docs.
    const result = await wcRequest<any>({
      apiKey,
      method: HttpMethod.POST,
      url: `/api/v1/chatlogs/${chatlogId}/tags`, // TODO: confirm path
      body: { tag },
    });

    return result;
  },
});