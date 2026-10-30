import { createAction, Property } from '@activepieces/pieces-framework';
import { addContactToCampaign, getCampaigns } from '../common';
import { leadConnectorProps } from '../common/props';
import { leadConnectorAuth } from '../..';

export const addContactToCampaignAction = createAction({
  auth: leadConnectorAuth,
  name: 'add_contact_to_campaign',
  classification: 'WRITE',
  displayName: 'Add Contact to Campaign',
  description: 'Add an existing contact to a campaign.',
  audience: 'both',
  aiMetadata: { description: 'Enrolls an existing GoHighLevel/LeadConnector contact into a marketing campaign by contact ID and campaign ID. Use to start a campaign sequence for a known contact. Not idempotent — each call re-enrolls the contact.', idempotent: false },
  props: {
    contact: leadConnectorProps.contact({ required: true }),
    campaign: Property.Dropdown({
      auth: leadConnectorAuth,
      displayName: 'Campaign',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Connect your account first',
          };
        }

        const campaigns = await getCampaigns(auth);
        return {
          options: campaigns.map((campaign: any) => {
            return {
              label: campaign.name,
              value: campaign.id,
            };
          }),
        };
      },
    }),
  },

  async run({ auth, propsValue }) {
    const { contact, campaign } = propsValue;

    return await addContactToCampaign(auth.access_token, contact, campaign);
  },
});
