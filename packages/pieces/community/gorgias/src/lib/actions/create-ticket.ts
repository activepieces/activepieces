import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { gorgiasAuth } from '../auth';
import { gorgiasApiCall } from '../common/client';
import {
  GORGIAS_CHANNEL_OPTIONS,
  GORGIAS_VIA_OPTIONS,
} from '../common/constants';

export const createTicketAction = createAction({
  auth: gorgiasAuth,
  name: 'create_gorgias_ticket',
  displayName: 'Create Ticket',
  description: 'Create a new Gorgias ticket with an initial message.',
  props: {
    fromAddress: Property.ShortText({
      displayName: 'From Address',
      description: 'The sender address for the initial message, typically the customer email.',
      required: true,
    }),
    toAddress: Property.ShortText({
      displayName: 'To Address',
      description: 'The recipient address for the initial message.',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      required: true,
    }),
    message: Property.LongText({
      displayName: 'Message',
      description: 'Initial ticket message. HTML is accepted by the API.',
      required: true,
    }),
    channel: Property.StaticDropdown({
      displayName: 'Channel',
      required: true,
      options: GORGIAS_CHANNEL_OPTIONS,
      defaultValue: 'email',
    }),
    via: Property.StaticDropdown({
      displayName: 'Via',
      description: 'How the message reached Gorgias.',
      required: true,
      options: GORGIAS_VIA_OPTIONS,
      defaultValue: 'api',
    }),
  },
  async run(context) {
    const { fromAddress, toAddress, subject, message, channel, via } =
      context.propsValue;

    return await gorgiasApiCall({
      auth: context.auth.props,
      method: HttpMethod.POST,
      resourceUri: '/tickets',
      body: {
        messages: [
          {
            from_agent: false,
            subject,
            body_html: message,
            channel,
            via,
            source: {
              from: {
                address: fromAddress,
              },
              to: [
                {
                  address: toAddress,
                },
              ],
            },
          },
        ],
      },
    });
  },
});
