import { createAction, Property } from '@activepieces/pieces-framework';
import { makeFolkRequest, FolkCompany, folkAuth } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';

export const getCompanyAction = createAction({
  auth: folkAuth,
  name: 'get_company',
  displayName: 'Get a Company',
  description: 'Retrieves a company by contact ID',
  props: {
    companyId: Property.ShortText({
      displayName: 'Company ID',
      description: 'ID of the company to retrieve',
      required: true,
    }),
  },
  async run(context) {
    try {
      const response = await makeFolkRequest<{ contact: FolkCompany }>(
        context.auth,
        HttpMethod.GET,
        `/companies/${context.propsValue.companyId}`
      );

      return {
        success: true,
        company: response,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Company not found',
      };
    }
  },
});