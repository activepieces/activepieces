import { createAction, Property } from '@activepieces/pieces-framework';
import { emailitAuth } from '../auth';
import { emailitDropdowns } from '../common/dropdowns';
import { emailitOperations } from '../common/operations';
import { emailitSchemas } from '../common/output-schemas';
import { emailitProps } from '../common/props';

export const removeSubscriberAction = createAction({
  auth: emailitAuth,
  name: 'remove_subscriber',
  displayName: 'Remove Subscriber',
  description: 'Delete someone\'s membership in an audience. The contact is kept.',
  audience: 'human',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Removes one subscriber (by sub_… ID or email) from an Emailit audience; the contact and its other audiences are kept, and no opt-out is recorded (for opt-outs use Update Subscriber with Subscribed off instead). If nothing matches, returns alreadyRemoved=true instead of failing. Needs a Full Access key.',
    idempotent: true,
  },
  outputSchema: emailitSchemas.removed,
  props: { audience: emailitDropdowns.audience(), subscriber: subscriberProp() },
  async run({ auth, propsValue }) {
    return emailitOperations.removeSubscriber({ auth, input: { audience: propsValue.audience, subscriber: propsValue.subscriber } });
  },
});

export const removeSubscriberByIdAction = createAction({
  auth: emailitAuth,
  name: 'remove_subscriber_by_id',
  displayName: 'Remove Subscriber (by ID)',
  description: 'Remove a subscriber from an audience given by ID or name.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Removes one subscriber (by sub_… ID or email) from an Emailit audience; the contact and its other audiences are kept, and no opt-out is recorded (for opt-outs use Update Subscriber with Subscribed off instead). If nothing matches, returns alreadyRemoved=true instead of failing. Needs a Full Access key. Get the audience ID from List Audiences first.',
    idempotent: true,
  },
  outputSchema: emailitSchemas.removed,
  props: { audience: emailitProps.audienceId(), subscriber: subscriberProp() },
  async run({ auth, propsValue }) {
    return emailitOperations.removeSubscriber({ auth, input: { audience: propsValue.audience, subscriber: propsValue.subscriber } });
  },
});

function subscriberProp() {
  return Property.ShortText({ displayName: 'Subscriber', description: 'Subscriber ID (sub_…) or email address.', required: true });
}
