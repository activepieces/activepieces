import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { visibleAuth } from '../..';
import { visibleMakeRequest } from '../common';

export const createPortfolioCompany = createAction({
  name: 'create_portfolio_company',
  displayName: 'Create Portfolio Company',
  description: 'Creates a new portfolio company.',
  auth: visibleAuth,
  props: {
    companyId: Property.ShortText({
      displayName: 'Company ID',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      required: true,
    }),
    websiteUrl: Property.ShortText({
      displayName: 'Website URL',
      required: false,
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      required: false,
    }),
    primaryContactId: Property.ShortText({
      displayName: 'Primary Contact ID',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const portfolioCompanyProfile: Record<string, unknown> = {
      name: propsValue.name,
      company_id: propsValue.companyId,
    };

    if (propsValue.websiteUrl) {
      portfolioCompanyProfile['website_url'] = propsValue.websiteUrl;
    }

    if (propsValue.currency) {
      portfolioCompanyProfile['currency'] = propsValue.currency;
    }

    if (propsValue.primaryContactId) {
      portfolioCompanyProfile['primary_contact_id'] = propsValue.primaryContactId;
    }

    return await visibleMakeRequest({
      accessToken: auth.secret_text,
      method: HttpMethod.POST,
      path: '/portfolio_company_profiles',
      body: {
        portfolio_company_profile: portfolioCompanyProfile,
      },
    });
  },
});
