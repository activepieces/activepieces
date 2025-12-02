import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { trustpilotAuth } from '../common/auth';
import { getbussinessUnitId } from '../common/props';
import { domain } from 'zod/v4/core/regexes.cjs';

export const createInvitation = createAction({
  auth: trustpilotAuth,
  name: 'createInvitation',
  displayName: 'Create Invitation',
  description: 'Create an email invitation for service or product reviews',
  props: {
    domain: Property.ShortText({
      displayName: 'Domain Name',
      description: 'Your business domain name registered with Trustpilot',
      required: true,
    }),
    consumerName: Property.ShortText({
      displayName: 'Consumer Name',
      description: 'The name of the customer to invite',
      required: true,
    }),
    consumerEmail: Property.ShortText({
      displayName: 'Consumer Email',
      description: 'The email address of the customer to invite',
      required: true,
    }),
    senderName: Property.ShortText({
      displayName: 'Sender Name',
      description: 'Name of the person sending the invitation',
      required: false,
    }),
    senderEmail: Property.ShortText({
      displayName: 'Sender Email',
      description: 'Email address of the person sending the invitation',
      required: false,
    }),
    replyTo: Property.ShortText({
      displayName: 'Reply To Email',
      description: 'Email address where replies should be sent',
      required: false,
    }),
    locationId: Property.ShortText({
      displayName: 'Location ID',
      description: 'The ID of the specific location/branch',
      required: false,
    }),
    referenceNumber: Property.ShortText({
      displayName: 'Reference Number',
      description: 'A unique reference number for tracking this invitation',
      required: false,
    }),
    type: Property.StaticDropdown({
      displayName: 'Invitation Type',
      description: 'Type of invitation to send',
      required: true,
      defaultValue: 'email',
      options: {
        options: [{ label: 'Email', value: 'email' }],
      },
    }),
    locale: Property.ShortText({
      displayName: 'Locale',
      description: 'Language locale for the invitation (e.g., en-US, da-DK)',
      required: false,
      defaultValue: 'en-US',
    }),
    templateId: Property.ShortText({
      displayName: 'Template ID',
      description: 'The ID of the email template to use',
      required: true,
    }),
    preferredSendTime: Property.ShortText({
      displayName: 'Preferred Send Time',
      description:
        'When to send the invitation (UTC format: MM/DD/YYYY HH:MM:SS)',
      required: false,
    }),
    redirectUri: Property.ShortText({
      displayName: 'Redirect URI',
      description: 'URL to redirect customer to after leaving a review',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tags to organize and track invitations',
      required: false,
    }),
  },
  async run(context) {
    const payload: any = {
      consumerName: context.propsValue.consumerName,
      consumerEmail: context.propsValue.consumerEmail,
      type: context.propsValue.type,
      locale: context.propsValue.locale,
      templateId: context.propsValue.templateId,
    };

    if (context.propsValue.senderName) {
      payload.senderName = context.propsValue.senderName;
    }
    if (context.propsValue.senderEmail) {
      payload.senderEmail = context.propsValue.senderEmail;
    }
    if (context.propsValue.replyTo) {
      payload.replyTo = context.propsValue.replyTo;
    }
    if (context.propsValue.locationId) {
      payload.locationId = context.propsValue.locationId;
    }
    if (context.propsValue.referenceNumber) {
      payload.referenceNumber = context.propsValue.referenceNumber;
    }

    // Service Review Invitation
    const serviceReviewInvitation: any = {
      templateId: context.propsValue.templateId,
    };

    if (context.propsValue.preferredSendTime) {
      serviceReviewInvitation.preferredSendTime =
        context.propsValue.preferredSendTime;
    }
    if (context.propsValue.redirectUri) {
      serviceReviewInvitation.redirectUri = context.propsValue.redirectUri;
    }
    if (context.propsValue.tags && context.propsValue.tags.length > 0) {
      serviceReviewInvitation.tags = context.propsValue.tags;
    }

    payload.serviceReviewInvitation = serviceReviewInvitation;
    const businessUnitId = await getbussinessUnitId(
      context.auth.access_token as string,
      context.propsValue.domain
    );
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://invitations-api.trustpilot.com/v1/private/business-units/${businessUnitId}/email-invitations`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${context.auth.access_token}`,
      },
      body: payload,
    });

    return response.body;
  },
});
