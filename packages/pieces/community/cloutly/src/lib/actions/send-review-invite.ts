import { cloutlyAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const sendReviewInvite = createAction({
  auth:cloutlyAuth,
  name: 'sendReviewInvite',
  displayName: 'Send Review Invite',
  description: 'Sends a review invite to your customer.',
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
      required: false
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
    salesRepEmail: Property.ShortText({
      displayName: 'Sales Rep Email',
      description: 'The email of the sales rep to associate the review and customer',
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
      salesRepEmail: context.propsValue.salesRepEmail,
    };

    const apiKey = context.auth as string;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://app.cloutly.com/api/v1/send-review-invite',
      body: data,
      headers: {
        'Content-Type': 'application/json',
        'x-app': 'activepieces',
        'x-api-key': apiKey
      }
    })

    return response.body;
  },
});
