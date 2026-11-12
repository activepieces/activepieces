import { createAction, Property } from '@activepieces/pieces-framework';
import { emailitAuth } from '../auth';
import { emailitDropdowns } from '../common/dropdowns';
import { emailitOperations } from '../common/operations';
import { emailitSchemas } from '../common/output-schemas';
import { emailitProps } from '../common/props';

export const updateSubscriberAction = createAction({
  auth: emailitAuth,
  name: 'update_subscriber',
  displayName: 'Update Subscriber',
  description: 'Subscribe or unsubscribe someone from an audience, or change their name.',
  audience: 'human',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Updates one subscriber of an Emailit audience, found by subscriber ID (sub_…) or email address: turn Subscribed on or off for this audience (use this for opt-outs), or change first/last name (names belong to the contact, so they change everywhere). Only the fields given are sent. Repeating with the same values changes nothing. Needs a Full Access key.',
    idempotent: true,
  },
  outputSchema: emailitSchemas.subscriberUpdated,
  props: { audience: emailitDropdowns.audience(), ...fields() },
  async run({ auth, propsValue }) {
    return emailitOperations.updateSubscriber({ auth, input: { audience: propsValue.audience, subscriber: propsValue.subscriber, subscribed: propsValue.subscribed, firstName: propsValue.first_name, lastName: propsValue.last_name } });
  },
});

export const updateSubscriberByIdAction = createAction({
  auth: emailitAuth,
  name: 'update_subscriber_by_id',
  displayName: 'Update Subscriber (by ID)',
  description: 'Update a subscriber of an audience given by ID or name.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Updates one subscriber of an Emailit audience, found by subscriber ID (sub_…) or email address: turn Subscribed on or off for this audience (use this for opt-outs), or change first/last name (names belong to the contact, so they change everywhere). Only the fields given are sent. Repeating with the same values changes nothing. Needs a Full Access key. Get the audience ID from List Audiences first.',
    idempotent: true,
  },
  outputSchema: emailitSchemas.subscriberUpdated,
  props: { audience: emailitProps.audienceId(), ...fields() },
  async run({ auth, propsValue }) {
    return emailitOperations.updateSubscriber({ auth, input: { audience: propsValue.audience, subscriber: propsValue.subscriber, subscribed: propsValue.subscribed, firstName: propsValue.first_name, lastName: propsValue.last_name } });
  },
});

function fields() {
  return {
    subscriber: Property.ShortText({ displayName: 'Subscriber', description: 'Subscriber ID (sub_…) or email address.', required: true }),
    subscribed: Property.StaticDropdown<'keep' | 'yes' | 'no'>({
      displayName: 'Subscribed',
      required: false,
      defaultValue: 'keep',
      options: { disabled: false, options: [{ label: 'Keep as is', value: 'keep' }, { label: 'Subscribed', value: 'yes' }, { label: 'Unsubscribed', value: 'no' }] },
    }),
    first_name: Property.ShortText({ displayName: 'First Name', description: 'Leave empty to keep.', required: false }),
    last_name: Property.ShortText({ displayName: 'Last Name', description: 'Leave empty to keep.', required: false }),
  };
}
