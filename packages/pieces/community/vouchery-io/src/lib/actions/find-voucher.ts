import { createAction, Property } from '@activepieces/pieces-framework';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { voucheryIoAuth } from '../common/auth';

export const findVoucher = createAction({
  auth: voucheryIoAuth,
  name: 'findVoucher',
  displayName: 'Find Voucher',
  description:
    'Find a voucher by campaign metadata. At least one metadata must be provided',
  audience: 'both',
  aiMetadata: {
    description:
      'Looks up an existing Vouchery voucher by campaign metadata (purpose, team, channel, medium); at least one metadata filter must be provided. Optionally, supplying a customer identifier also assigns the found voucher to that customer (a mutation), otherwise it is a pure read. Use to retrieve a voucher matching campaign criteria before redemption or assignment.',
    idempotent: true,
  },
  props: {
    purpose: Property.ShortText({
      displayName: 'Purpose',
      description: 'Purpose metadata (multiple values allowed)',
      required: false,
    }),
    team: Property.ShortText({
      displayName: 'Team',
      description: 'Team metadata (multiple values allowed)',
      required: false,
    }),
    channel: Property.ShortText({
      displayName: 'Channel',
      description: 'Channel metadata (multiple values allowed)',
      required: false,
    }),
    medium: Property.ShortText({
      displayName: 'Medium',
      description: 'Medium metadata (multiple values allowed)',
      required: false,
    }),
    customer_identifier: Property.ShortText({
      displayName: 'Customer Identifier',
      description:
        'Optional: Assign the found voucher to a customer by providing their identifier',
      required: false,
    }),
  },
  async run(context) {
    const { purpose, team, channel, medium, customer_identifier } =
      context.propsValue;

    const params = new URLSearchParams();

    if (purpose && purpose.length > 0) {
      params.append('purpose', purpose);
    }
    if (team && team.length > 0) {
      params.append('team', team);
    }
    if (channel && channel.length > 0) {
      params.append('channel', channel);
    }
    if (medium && medium.length > 0) {
      params.append('medium', medium);
    }
    if (customer_identifier) {
      params.append('customer_identifier', customer_identifier);
    }

    const queryString = params.toString();
    const path = `/vouchers/find${queryString ? '?' + queryString : ''}`;

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.GET,
      path
    );

    return response;
  },
});
