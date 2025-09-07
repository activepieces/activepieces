import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { zohoCampaignsAuth, zohoCampaignsCommon } from '../common';

export const findContact = createAction({
  auth: zohoCampaignsAuth,
  name: 'findContact',
  displayName: 'Find Contact',
  description: 'Look up an existing contact by email address.',
  props: zohoCampaignsCommon.findContactProperties(),
  async run({ auth: { access_token: accessToken }, propsValue }) {
    await propsValidation.validateZod(
      propsValue,
      zohoCampaignsCommon.findContactSchema
    );
    const { listkey, contactEmail: email } = propsValue;
    const contacts = await zohoCampaignsCommon.listContacts({
      accessToken,
      listkey: listkey as string,
    });
    const needle = (email ?? '').trim().toLowerCase();
    // Try to find case-insensitive and partial match
    const contact = contacts.filter((contact) =>
      (contact.contact_email ?? '').toLowerCase().includes(needle)
    );

    if (contact.length === 0) {
      throw new Error(
        `No contact found with an email containing "${email}" in the selected campaign.`
      );
    }

    return contact
  },
});
