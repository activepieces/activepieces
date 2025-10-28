import { createAction, Property } from '@activepieces/pieces-framework';
import { makeFolkRequest, FolkCompany, folkAuth } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';

export const updateCompanyAction = createAction({
  auth: folkAuth,
  name: 'update_company',
  displayName: 'Update Company',
  description: 'Updates a company contact in a folk group',
  props: {
    companyId: Property.ShortText({
      displayName: 'Company ID',
      description: 'ID of the company to update',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Company Name',
      description: 'Name of the company',
      required: false,
    }),
    description: Property.ShortText({
      displayName: 'Description',
      description: 'A short description of the company.',
      required: false,
    }),
    fundingRaised: Property.Number({
      displayName: 'Funding Raised',
      description: 'The amount of funding raised by the company in USD, as a number.',
      required: false,
    }),
    lastFundingDate: Property.ShortText({
      displayName: 'Last Funding Date',
      description: 'The date of the last funding round for the company, in YYYY-MM-DD format.',
      required: false,
    }),
    foundationYear: Property.ShortText({
      displayName: 'Foundation Year',
      description: 'The foundation year of the company, in YYYY format as string.',
      required: false,
    }),
    industry: Property.ShortText({
      displayName: 'Industry',
      description: 'The industry the company operates in.',
      required: false,
    }),
    employeeRange: Property.ShortText({
      displayName: 'Employee Range',
      description: 'The employee range of the company.',
      required: false,
    }),
  },
  async run(context) {
    const updateData: any = {

    };

    if (context.propsValue.name) updateData.name = context.propsValue.name;
    if (context.propsValue.description) updateData.phone = context.propsValue.description;
    if (context.propsValue.lastFundingDate) updateData.website = context.propsValue.lastFundingDate;
    if (context.propsValue.employeeRange) updateData.linkedin = context.propsValue.employeeRange;
    if (context.propsValue.industry) updateData.industry = context.propsValue.industry;
    if (context.propsValue.fundingRaised) updateData.fundingRaised = context.propsValue.fundingRaised;
    if (context.propsValue.foundationYear) updateData.fundingRaised = context.propsValue.foundationYear;

    try {
      const response = await makeFolkRequest<FolkCompany>(
        context.auth,
        HttpMethod.PATCH,
        `/companies/${context.propsValue.companyId}`,
        updateData
      );

      return {
        success: true,
        company: response,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.body?.error?.message || error.message || 'Failed to update company',
        details: error.response?.body?.error?.details,
      };
    }
  },
});