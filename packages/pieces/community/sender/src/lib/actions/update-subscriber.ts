import { createAction, Property} from '@activepieces/pieces-framework';
import { makeSenderRequest, senderAuth, subscriberDropdownSingle } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';
import { subscribe } from 'diagnostics_channel';


export const updateSubscriberAction = createAction({
  auth: senderAuth,
  name: 'update_subscriber',
  displayName: 'Update Subscriber',
  description: 'Update an existing subscriber\'s data',
  props: {
    subscriber: subscriberDropdownSingle,
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Subscriber email address to update',
      required: true,
    }),
    firstname: Property.ShortText({
      displayName: 'First Name',
      description: 'New first name',
      required: false,
    }),
    lastname: Property.ShortText({
      displayName: 'Last Name',
      description: 'New last name',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'New phone number',
      required: false,
    }),
    customFields: Property.Json({
      displayName: 'Custom Fields',
      description: 'JSON object with custom field keys and values to update',
      required: false,
    }),
  },
  async run(context) {
    const email = context.propsValue.email;
    const phone = context.propsValue.phone;
    const {subscriber}= context.propsValue;

    const subscriberId = subscriber;
    const updateData: any = {};

    if (context.propsValue.firstname) {
      updateData.firstname = context.propsValue.firstname;
    }
    if (context.propsValue.lastname) {
      updateData.lastname = context.propsValue.lastname;
    }
    if (context.propsValue.phone) {
      updateData.phone = context.propsValue.phone;
    }
    if (context.propsValue.customFields) {
      updateData.fields = context.propsValue.customFields;
    }

    const response = await makeSenderRequest(
      context.auth,
      `/subscribers/${subscriberId}`,
      HttpMethod.PATCH,
      updateData
    );

    return response.body;
  },
});