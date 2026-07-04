import { Property, createAction } from '@activepieces/pieces-framework';
import { onfleetAuth } from '../..';

import Onfleet from '@onfleet/node-onfleet';

export const getRecipient = createAction({
  auth: onfleetAuth,
  name: 'get_recipient',
  displayName: 'Get Recipient',
  description: 'Gets a single recipient',
  audience: 'both',
  aiMetadata: { description: 'Fetches a single Onfleet recipient (the customer receiving a delivery) by recipient ID. Read-only and idempotent. Requires a known recipient ID; this action only looks up by ID, not by name or phone.', idempotent: true },
  props: {
    id: Property.ShortText({
      displayName: 'Recipient ID',
      description: "The recipient's ID",
      required: true,
    }),
  },
  async run(context) {
    const onfleetApi = new Onfleet(context.auth.secret_text);

    return await onfleetApi.recipients.get(context.propsValue['id']);
  },
});
