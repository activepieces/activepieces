import { Property, createAction } from '@activepieces/pieces-framework';
import { onfleetAuth } from '../..';

import Onfleet from '@onfleet/node-onfleet';

export const createRecipient = createAction({
  auth: onfleetAuth,
  name: 'create_recipient',
  displayName: 'Create Recipient',
  description: 'Creates a recipient',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: "The recipient's full name",
      required: true,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description:
        "A unique, valid phone number as per the organization's country if there's no leading + sign. If a phone number has a leading + sign, it will disregard the organization's country setting.",
      required: true,
    }),
    notes: Property.ShortText({
      displayName: 'Notes',
      required: false,
    }),
    skipSMSNotifications: Property.Checkbox({
      displayName: 'Skip SMS Notifications',
      required: false,
      defaultValue: false,
    }),
    skipPhoneNumberValidation: Property.Checkbox({
      displayName: 'Skip Phone Number Validation',
      required: false,
      defaultValue: false,
    }),
    useLongCodeForText: Property.Checkbox({
      displayName: 'Use Long Code for Text - Canadian Organizations Only',
      description:
        'Checking this option will default the Onfleet system to use a toll-free long code number for SMS communication.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const onfleetApi = new Onfleet(context.auth);
    const recipient: any = {
      name: context.propsValue['name'],
      phone: context.propsValue['phone'],
      notes: context.propsValue['notes'] ?? undefined,
      skipSMSNotifications: context.propsValue['skipSMSNotifications'],
      skipPhoneNumberValidation:
        context.propsValue['skipPhoneNumberValidation'],
      useLongCodeForText: context.propsValue['useLongCodeForText'],
    };

    return await onfleetApi.recipients.create(recipient);
  },
});
