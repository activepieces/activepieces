import { createAction, Property } from '@activepieces/pieces-framework';
import { linkupAuth, linkupAction, accountIdProp } from '../common';

export const getCompany = createAction({
  auth: linkupAuth,
  name: 'get_company',
  displayName: 'Get Company Info',
  description: 'Retrieve detailed information about a LinkedIn company page.',
  audience: 'both',
  aiMetadata: { description: 'Looks up one LinkedIn company page from its URL. Use Search Companies first when only a company name is known, and Get Profile Info for a person rather than an organisation. Requires both the account ID and an exact company page URL. Read-only and idempotent.', idempotent: true },
  props: {
    accountId: accountIdProp,
    companyUrl: Property.ShortText({
      displayName: 'Company URL',
      description: 'LinkedIn company page URL',
      required: true,
    }),
  },
  async run(context) {
    const { accountId, companyUrl } = context.propsValue;
    return linkupAction(context.auth.secret_text, 'profiles', 'get_company', accountId, {
      company_url: companyUrl,
    });
  },
});
