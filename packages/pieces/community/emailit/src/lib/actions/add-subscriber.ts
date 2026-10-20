import { createAction, Property } from '@activepieces/pieces-framework';
import { emailitAuth } from '../auth';
import { emailitDropdowns } from '../common/dropdowns';
import { emailitOperations } from '../common/operations';
import { emailitSchemas } from '../common/output-schemas';
import { emailitProps } from '../common/props';

export const addSubscriberAction = createAction({
  auth: emailitAuth,
  name: 'add_subscriber',
  displayName: 'Add Subscriber to Audience',
  description: 'Add an email address to an audience, creating the contact if needed.',
  audience: 'human',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Adds an email address to an Emailit audience (creating the contact if it does not exist) with optional first/last name and custom fields, which overwrite the contact\'s values. If the address is already subscribed nothing changes and alreadySubscribed=true is returned; if it had unsubscribed, this resubscribes it, so only use it when the person opted in again. Returns the subscriber (id = sub_…); pass that id or the email to Update Subscriber or Remove Subscriber. Needs a Full Access key.',
    idempotent: true,
  },
  outputSchema: emailitSchemas.subscriber,
  props: { audience: emailitDropdowns.audience(), ...fields() },
  async run({ auth, propsValue }) {
    return emailitOperations.addSubscriber({ auth, input: { audience: propsValue.audience, email: propsValue.email, firstName: propsValue.first_name, lastName: propsValue.last_name, customFields: propsValue.custom_fields } });
  },
});

export const addSubscriberByIdAction = createAction({
  auth: emailitAuth,
  name: 'add_subscriber_by_id',
  displayName: 'Add Subscriber to Audience (by ID)',
  description: 'Add an email address to an audience given by ID or name.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Adds an email address to an Emailit audience (creating the contact if it does not exist) with optional first/last name and custom fields, which overwrite the contact\'s values. If the address is already subscribed nothing changes and alreadySubscribed=true is returned; if it had unsubscribed, this resubscribes it, so only use it when the person opted in again. Returns the subscriber (id = sub_…); pass that id or the email to Update Subscriber or Remove Subscriber. Needs a Full Access key. Get the audience ID from List Audiences first.',
    idempotent: true,
  },
  outputSchema: emailitSchemas.subscriber,
  props: { audience: emailitProps.audienceId(), ...fields() },
  async run({ auth, propsValue }) {
    return emailitOperations.addSubscriber({ auth, input: { audience: propsValue.audience, email: propsValue.email, firstName: propsValue.first_name, lastName: propsValue.last_name, customFields: propsValue.custom_fields } });
  },
});

function fields() {
  return {
    email: Property.ShortText({ displayName: 'Email', required: true }),
    first_name: Property.ShortText({ displayName: 'First Name', required: false }),
    last_name: Property.ShortText({ displayName: 'Last Name', required: false }),
    custom_fields: Property.Object({ displayName: 'Custom Fields', description: 'Replaces all of the contact\'s custom fields, e.g. company: Acme.', required: false }),
  };
}
