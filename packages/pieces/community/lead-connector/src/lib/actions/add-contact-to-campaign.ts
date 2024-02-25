import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { addContactToCampaign, getCampaigns, getContacts } from '../common';
import { leadConnectorAuth } from '../..';

export const addContactToCampaignAction = createAction({
  auth: leadConnectorAuth,
  name: 'add_contact_to_campaign',
  displayName: 'Add Contact to Campaign',
  description: 'Add an existing contact to a campaign.',
  props: {
    contact: Property.Dropdown({
      displayName: 'Contact',
      description: 'The contact to use.',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth)
          return {
            disabled: true,
            options: [],
          };

        const contacts = await getContacts(auth as OAuth2PropertyValue);
        return {
          options: contacts.map((contact) => {
            return {
              label: contact.contactName,
              value: contact.id,
            };
          }),
        };
      },
    }),
    campaign: Property.Dropdown({
      displayName: 'Campaign',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
          };
        }

        const campaigns = await getCampaigns(auth as OAuth2PropertyValue);
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
