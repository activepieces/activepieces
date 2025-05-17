import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const unubscribeUserFromSequence = createAction({
  name: 'unubscribeUserFromSequence',
  displayName: 'Unsubscribe User from Sequence',
  description:
    'Stop nurturing sequence after the user completes a goal or opts out.',
  props: {
    subscriber_id: Property.Number({
      displayName: 'Subscriber ID',
      description: 'The ID of the subscriber to update',
      required: true,
    }),
    has_opt_in_sms: Property.Checkbox({
      displayName: 'SMS Opt-in',
      description: 'Whether the subscriber has opted in for SMS',
      required: false,
      defaultValue: false,
    }),
    has_opt_in_email: Property.Checkbox({
      displayName: 'Email Opt-in',
      description: 'Whether the subscriber has opted in for email',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { subscriber_id, has_opt_in_sms, has_opt_in_email } = propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.manychat.com/fb/subscriber/updateSubscriber',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${auth}`,
        'Content-Type': 'application/json',
      },
      body: {
        subscriber_id: subscriber_id,
        has_opt_in_sms: has_opt_in_sms,
        has_opt_in_email: has_opt_in_email,
      },
    });

    return response.body;
  },
});
