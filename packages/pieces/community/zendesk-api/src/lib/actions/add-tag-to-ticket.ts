import {
  Property,
  createAction,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { zendeskApiAuth } from '../..';

export const addTagToTicket = createAction({
  auth: zendeskApiAuth,
  name: 'add_tag_to_ticket',
  displayName: 'Add Tag to Ticket',
  description: 'Apply one or more tags to a ticket',
  props: {
    ticket_id: Property.Number({
      displayName: 'Ticket ID',
      description: 'The ID of the ticket to add tags to',
      required: true,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tags to add to the ticket',
      required: true,
      of: Property.ShortText({
        displayName: 'Tag',
        description: 'A tag to add to the ticket',
        required: true,
      }),
    }),
    updated_stamp: Property.DateTime({
      displayName: 'Updated Stamp',
      description: 'The ticket\'s latest updated_at timestamp for safe update (optional)',
      required: false,
    }),
    safe_update: Property.Checkbox({
      displayName: 'Safe Update',
      description: 'Enable safe update to prevent tag loss during concurrent updates',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { email, token, subdomain } = auth as {
      email: string;
      token: string;
      subdomain: string;
    };

    const requestBody: any = {
      tags: propsValue.tags,
    };

    // Add safe update properties if enabled
    if (propsValue.safe_update) {
      if (propsValue.updated_stamp) {
        requestBody.updated_stamp = propsValue.updated_stamp;
      }
      requestBody.safe_update = 'true';
    }

    const response = await httpClient.sendRequest({
      url: `https://${subdomain}.zendesk.com/api/v2/tickets/${propsValue.ticket_id}/tags.json`,
      method: HttpMethod.PUT,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${email}/token:${token}`).toString('base64')}`,
      },
      body: requestBody,
    });

    return response.body;
  },
}); 