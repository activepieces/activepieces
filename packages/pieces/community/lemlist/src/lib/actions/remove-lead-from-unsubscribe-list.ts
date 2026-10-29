import { createAction, Property } from '@activepieces/pieces-framework';
import { lemlistAuth } from '../common/constants';
import { lemlistLeads } from '../common/requests';
import { lemlistSchemas } from '../common/schemas';

export const removeLeadFromUnsubscribeList = createAction({
  auth: lemlistAuth,
  name: 'removeLeadFromUnsubscribeList',
  classification: 'WRITE',
  displayName: 'Remove Lead From Unsubscribe List',
  description: 'Remove a lead from the “unsubscribe” list so lemlist can contact them again. Only do this when the person opted back in.',
  audience: 'both',
  aiMetadata: {
    description:
      'Removes an email from the team-wide unsubscribe (do-not-contact) list so lemlist campaigns can email that person again. Only use when the person explicitly opted back in: contacting someone who unsubscribed can break anti-spam and privacy law. Fails with not found when the email is not on the list. Idempotent in effect: the email stays off the list.',
    idempotent: true,
  },
  props: {
    email: Property.ShortText({
      displayName: 'Lead Email',
      description: 'The email of the lead to remove from the unsubscribe list.',
      required: true,
    }),
  },
  outputSchema: lemlistSchemas.unsubscribe,
  async run({ auth, propsValue }) {
    return lemlistLeads.removeFromUnsubscribes({ apiKey: auth.secret_text, email: propsValue.email });
  },
});
