import { createAction, Property } from '@activepieces/pieces-framework';
import { lemlistAuth } from '../common/constants';
import { campaignsDropdown } from '../common/props';
import { lemlistLeads } from '../common/requests';
import { lemlistSchemas } from '../common/schemas';

export const removeLeadFromACampaign = createAction({
  auth: lemlistAuth,
  name: 'removeLeadFromACampaign',
  classification: 'DESTRUCTIVE',
  displayName: 'Remove Lead from A Campaign',
  description: 'Removes a lead from a specific campaign.',
  audience: 'human',
  aiMetadata: {
    description:
      'Deletes a lead, identified by email, from one Lemlist campaign (its sequence progress is lost). A second run fails with not found.',
    idempotent: false,
  },
  props: {
    campaignId: campaignsDropdown({ refreshers: ['auth'] }),
    email: Property.ShortText({
      displayName: 'Lead Email',
      description: 'The email of the lead to remove.',
      required: true,
    }),
  },
  outputSchema: lemlistSchemas.lead,
  async run({ auth, propsValue }) {
    return lemlistLeads.deleteLeadFromCampaign({
      apiKey: auth.secret_text,
      campaignId: propsValue.campaignId,
      lead: propsValue.email,
      remove: true,
    });
  },
});
