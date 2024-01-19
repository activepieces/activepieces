import { Property, createAction } from '@activepieces/pieces-framework';
import { onfleetAuth } from '../..';

import Onfleet from '@onfleet/node-onfleet';

export const getRecipient = createAction({
  auth: onfleetAuth,
  name: 'get_recipient',
  displayName: 'Get Recipient',
  description: 'Gets a single recipient',
  props: {
    id: Property.ShortText({
      displayName: 'Recipient ID',
      description: "The recipient's ID",
      required: true,
    }),
  },
  async run(context) {
    const onfleetApi = new Onfleet(context.auth);

    return await onfleetApi.recipients.get(context.propsValue['id']);
  },
});
