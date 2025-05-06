import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const addTagToUser = createAction({
  name: 'addTagToUser',
  displayName: 'Add Tag to User',
  description: 'Tag a user with "High-Intent Buyer" after they visit a pricing page.',
  props: {
    subscriber_id: Property.Number({
      displayName: 'Subscriber ID',
      description: 'The ID of the subscriber to add the tag to',
      required: true,
    }),
    tag_name: Property.ShortText({
      displayName: 'Tag Name',
      description: 'The name of the tag to add',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { subscriber_id, tag_name } = propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.manychat.com/fb/subscriber/addTagByName',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${auth}`,
        'Content-Type': 'application/json',
      },
      body: {
        subscriber_id: subscriber_id,
        tag_name: tag_name,
      },
    });

    return response.body;
  },
});
