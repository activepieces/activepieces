import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { zohoCampaignsAuth, zohoCampaignsCommon } from '../common';

export const findContact = createAction({
  auth: zohoCampaignsAuth,
  name: 'findContact',
  displayName: 'Find Contact',
  description: 'Look up an existing contact by email address.',
  props: zohoCampaignsCommon.findContactProperties(),
  async run({ auth, propsValue }) {
    const { access_token: accessToken, location } = auth as any;
    await propsValidation.validateZod(
      propsValue,
      zohoCampaignsCommon.findContactSchema
    );
    const { listkey, contactEmail: email, status, sort, fromindex, range } = propsValue;

    const searchParams: any = {
      accessToken,
      listkey: listkey as string,
    };

    if (status) searchParams.status = status;
    if (sort) searchParams.sort = sort;
    if (fromindex) searchParams.fromindex = fromindex;
    if (range) searchParams.range = range;

    const contacts = await zohoCampaignsCommon.listContacts({
      ...searchParams,
      location
    });
    const needle = (email ?? '').trim().toLowerCase();

    // Try to find case-insensitive and partial match
    const matchingContacts = contacts.filter((contact) =>
      (contact.contact_email ?? '').toLowerCase().includes(needle)
    );

    if (matchingContacts.length === 0) {
      const statusText = status ? ` with status "${status}"` : '';
      throw new Error(
        `No contact found with an email containing "${email}"${statusText} in the selected mailing list.`
      );
    }

    return matchingContacts;
  },
});
