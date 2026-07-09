import { createAction, Property } from '@activepieces/pieces-framework';
import { linkupAuth, linkupAction, accountIdProp } from '../common';

export const getCompany = createAction({
  auth: linkupAuth,
  name: 'get_company',
  displayName: 'Get Company Info',
  description: 'Retrieve detailed information about a LinkedIn company page.',
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
