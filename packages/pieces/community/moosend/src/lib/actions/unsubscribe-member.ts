import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { moosendAuth } from '../common/auth';
import { moosendApiCall } from '../common/client';

export const unsubscribeMember = createAction({
  auth: moosendAuth,
  name: 'unsubscribe_member',
  displayName: 'Unsubscribe Member',
  description: 'Remove a subscriber from a Moosend mailing list.',
  props: {
    mailing_list_id: Property.ShortText({
      displayName: 'Mailing List ID',
      description: 'The ID of the mailing list.',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address to unsubscribe.',
      required: true,
    }),
  },
  async run(context) {
    const response = await moosendApiCall<{ Context: Record<string, unknown> }>({
      method: HttpMethod.POST,
      path: `subscribers/${context.propsValue.mailing_list_id}/unsubscribe.json`,
      auth: context.auth,
      body: { Email: context.propsValue.email },
    });

    return response.body.Context;
  },
});
