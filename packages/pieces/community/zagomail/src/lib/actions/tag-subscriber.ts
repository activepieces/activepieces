import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { zagomailAuth } from '../../index';

export const tagSubscriberAction = createAction({
  auth: zagomailAuth,
  name: 'tag_subscriber',
  displayName: 'Tag Subscriber',
  description: 'Add one or more tags to an existing subscriber',
  props: {
    subscriberId: Property.ShortText({
      displayName: 'Subscriber ID',
      description: 'The ID of the subscriber to tag',
      required: true,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'The tags to add to the subscriber',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const payload = {
      tags: propsValue.tags,
    };

    return await makeRequest(
      auth as string,
      HttpMethod.POST,
      `/subscribers/${propsValue.subscriberId}/tags`,
      payload
    );
  },
});
