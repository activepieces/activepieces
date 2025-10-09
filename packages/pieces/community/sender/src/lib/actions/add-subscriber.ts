import { createAction, Property } from '@activepieces/pieces-framework';
import { groupIdsDropdown, makeSenderRequest, senderAuth } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';
import { group } from 'console';


export const addUpdateSubscriberAction = createAction({
  auth: senderAuth,
  name: 'add_update_subscriber',
  displayName: 'Add / Update Subscriber',
  description: 'Add a new subscriber or update existing subscriber\'s data',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Subscriber email address',
      required: true,
    }),
    firstname: Property.ShortText({
      displayName: 'First Name',
      description: 'Subscriber first name',
      required: false,
    }),
    lastname: Property.ShortText({
      displayName: 'Last Name',
      description: 'Subscriber last name',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Subscriber phone number',
      required: false,
    }),
    groups: groupIdsDropdown,
    customFields: Property.Json({
      displayName: 'Custom Fields',
      description: 'JSON object with custom field keys and values',
      required: false,
    }),
    triggerAutomation: Property.Checkbox({
      displayName: 'Trigger Automation',
      description: 'Whether to trigger automation workflows',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const subscriberData: any = {
      email: context.propsValue.email,
    };

    if (context.propsValue.firstname) {
      subscriberData.firstname = context.propsValue.firstname;
    }
    if (context.propsValue.lastname) {
      subscriberData.lastname = context.propsValue.lastname;
    }
    if (context.propsValue.phone) {
      subscriberData.phone = context.propsValue.phone;
    }
    if (context.propsValue.groups) {
      subscriberData.groups = context.propsValue.groups;
    }
    if (context.propsValue.customFields) {
      subscriberData.fields = context.propsValue.customFields;
    }
    if (context.propsValue.triggerAutomation) {
      subscriberData.trigger_automation = true;
    }

    const response = await makeSenderRequest(
      context.auth,
      '/subscribers',
      HttpMethod.POST,
      subscriberData
    );

    return response.body;
  },
});