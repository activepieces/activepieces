import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { reviewflowzAuth } from '../auth';
import { reviewflowzApi } from '../common/client';

export const unsubscribeContactAction = createAction({
  auth: reviewflowzAuth,
  name: 'unsubscribe_contact',
  classification: 'WRITE',
  displayName: 'Unsubscribe Contact',
  description: 'Stops review requests to a customer, on email, texts or both, from every campaign.',
  audience: 'both',
  aiMetadata: {
    description:
      'Opt a customer out of Reviewflowz review requests on email, text messages or both, across every campaign. Identify them by email or phone. Unsubscribing someone already unsubscribed changes nothing, so retries are safe.',
    idempotent: true,
  },
  props: {
    email: Property.ShortText({ displayName: 'Email', required: false }),
    phone: Property.ShortText({ displayName: 'Phone number', required: false }),
    channels: Property.StaticMultiSelectDropdown({
      displayName: 'Channels',
      description: 'Leave empty for both.',
      required: false,
      options: {
        options: [
          { label: 'Email', value: 'email' },
          { label: 'Text messages', value: 'sms' },
        ],
      },
    }),
  },
  async run(context) {
    const { auth, propsValue: input } = context;
    if (!input.email && !input.phone) {
      throw new Error('Send the email or the phone number to unsubscribe.');
    }
    return reviewflowzApi.call({
      auth,
      method: HttpMethod.POST,
      path: '/opt-outs',
      body: {
        ...(input.email ? { email: input.email } : {}),
        ...(input.phone ? { phone: input.phone } : {}),
        ...(input.channels && input.channels.length > 0 ? { channels: input.channels } : {}),
      },
    });
  },
});
