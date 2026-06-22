import { createAction, Property } from '@activepieces/pieces-framework';
import { dataforb2bAuth, dataForB2BRequest } from '../common';

export const enrichCompany = createAction({
  auth: dataforb2bAuth,
  name: 'enrich_company',
  displayName: 'Enrich Company',
  description: 'Retrieve comprehensive information about a company.',
  props: {
    companyIdentifier: Property.ShortText({
      displayName: 'Company Identifier',
      description: 'Company slug, LinkedIn URL, or encoded ID',
      required: true,
    }),
  },
  async run(context) {
    const { companyIdentifier } = context.propsValue;
    return dataForB2BRequest(context.auth.secret_text, '/enrich/company', {
      company_identifier: companyIdentifier,
    });
  },
});
