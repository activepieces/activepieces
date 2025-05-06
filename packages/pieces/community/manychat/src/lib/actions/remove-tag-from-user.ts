import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const removeTagFromUser = createAction({
  name: 'removeTagFromUser',
  displayName: 'Remove Tag from User',
  description: 'Remove a tag from a user in ManyChat.',
  props: {
    subscriber_id: Property.Number({
      displayName: 'Subscriber ID',
      description: 'The ID of the subscriber to remove the tag from',
      required: true,
    }),
    tag_name: Property.ShortText({
      displayName: 'Tag Name',
      description: 'The name of the tag to remove',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { subscriber_id, tag_name } = propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.manychat.com/fb/subscriber/removeTagByName',
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
