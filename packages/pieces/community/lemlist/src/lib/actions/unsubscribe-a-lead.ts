import { createAction, Property } from '@activepieces/pieces-framework';
import { lemlistAuth } from '../common/constants';
import { campaignsDropdown } from '../common/props';
import { lemlistLeads } from '../common/requests';
import { lemlistSchemas } from '../common/schemas';

export const unsubscribeALead = createAction({
  auth: lemlistAuth,
  name: 'unsubscribeALead',
  classification: 'DESTRUCTIVE',
  displayName: 'Unsubscribe a Lead',
  description: 'Unsubscribe a lead from a campaign.',
  audience: 'human',
  aiMetadata: {
    description:
      'Unsubscribes a lead, identified by email, from one Lemlist campaign so it gets no more messages from it. Cannot be undone from this piece.',
    idempotent: true,
  },
  props: {
    campaignId: campaignsDropdown({ refreshers: ['auth'] }),
    email: Property.ShortText({
      displayName: 'Lead Email',
      description: 'The email of the lead to unsubscribe.',
      required: true,
    }),
  },
  outputSchema: lemlistSchemas.unsubscribedLead,
  async run({ auth, propsValue }) {
    return lemlistLeads.deleteLeadFromCampaign({
      apiKey: auth.secret_text,
      campaignId: propsValue.campaignId,
      lead: propsValue.email,
      remove: false,
    });
  },
});
