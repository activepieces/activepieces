import { createAction, Property } from '@activepieces/pieces-framework';
import axios from 'axios';

export const sendReviewInvite = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'sendReviewInvite',
  displayName: 'Send Review Invite',
  description: 'Ask a customer to review your business',
  props: {
    firstName: Property.ShortText({
      displayName: 'First Name',
      required: true
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email of the customer to send the invite to (required if Phone Number is empty)',
      required: false
    }),
    phoneNumber: Property.ShortText({
      displayName: 'Phone Number',
      description: 'The phone number of the customer to send the invite to (required if Email is empty)',
      required: false
    }),
    sourceCustomerId: Property.ShortText({
      displayName: 'Source Customer ID',
      required: true
    }),
    businessId: Property.ShortText({
      displayName: 'Business ID',
      required: true
    }),
    campaignId: Property.ShortText({
      displayName: 'Campaign ID',
      required: true
    }),
    inviteDelayDays: Property.Number({
      displayName: 'Invite Delay Days',
      description: 'The number of days to delay the invite (i.e send after X days)',
      required: false
    }),
  },
  async run(context) {
    const data = {
      firstName: context.propsValue.firstName,
      lastName: context.propsValue.lastName,
      channel: {
        email: context.propsValue.email,
        phoneNumber: context.propsValue.phoneNumber,
      },
      source: 'api',
      sourceCustomerId: context.propsValue.sourceCustomerId,
      businessId: context.propsValue.businessId,
      campaignId: context.propsValue.campaignId,
      inviteDelayDays: context.propsValue.inviteDelayDays,
    };

    const apiKey = context.auth as string

    const response = await axios.post(
      'https://app.cloutly.com/api/v1/send-review-invite', 
      data, 
      {
        headers: {
          'Content-Type': 'application/json',
          'x-app': 'activepieces',
          'x-api-key': apiKey
        }
      },
    );
    return response.data;
  },
});
