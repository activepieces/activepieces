import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { zohoCampaignsAuth, zohoCampaignsCommon } from '../common';

export const addContactToMailingList = createAction({
  auth: zohoCampaignsAuth,
  name: 'addContactToMailingList',
  displayName: 'Add Contact to Mailing List',
  description: 'Add contacts to your mailing lists.',
  audience: 'both',
  aiMetadata: {
    description:
      'Adds one or more contacts (by email address) to a specified mailing list. Use to subscribe known emails in bulk to a list. Idempotent: re-adding emails already on the list leaves the membership unchanged.',
    idempotent: true,
  },
  props: zohoCampaignsCommon.addContactToMailingListProperties(),
  async run({ auth, propsValue }) {
    const location = auth.props?.['location'] as string || 'zoho.com';
    const accessToken = auth.access_token

    await propsValidation.validateZod(
      propsValue,
      zohoCampaignsCommon.addContactToMailingListSchema
    );
    return await zohoCampaignsCommon.addContactToMailingList({
      accessToken,
      location,
      listkey: String(propsValue.listkey),
      emailids: propsValue.emails.join(','),
    });
  },
});
