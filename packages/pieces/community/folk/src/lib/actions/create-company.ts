import { createAction, Property } from '@activepieces/pieces-framework';
import { makeFolkRequest, FolkCompany, folkAuth } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';

export const createCompanyAction = createAction({
  auth: folkAuth,
  name: 'create_company',
  displayName: 'Create Company',
  description: 'Creates a new company contact in a folk group',
  props: {
    name: Property.ShortText({
      displayName: 'Company Name',
      description: 'Name of the company',
      required: true,
    }),
    groupId: Property.ShortText({
      displayName: 'Group ID',
      description: 'ID of the group to add the company to',
      required: true,
    }),
    description: Property.ShortText({
      displayName: 'Description',
      description: 'Description',
      required: false,
    }),
    fundingRaised: Property.Number({
      displayName: 'Funding Raised',
      description: 'The amount of funding raised by the company in USD, as a number.',
      required: false,
    }),
    lastFundingDate: Property.DateTime({
      displayName: 'Last Funding Date',
      description: 'The date of the last funding round for the company, in YYYY-MM-DD format.',
      required: false,
    }),
    industry: Property.ShortText({
      displayName: 'Industry',
      description: 'The industry the company operates in.',
      required: false,
    }),
    foundationYear: Property.ShortText({
      displayName: 'Foundation Year',
      description: 'The foundation year of the company, in YYYY format as string.',
      required: false,
    }),
    employeeRange: Property.ShortText({
      displayName: 'Employee Range',
      description: 'The employee range of the company.',
      required: false,
    })
  },
  async run(context) {
    const companyData: any = {
      name: context.propsValue.name,
      groups: [{ id: context.propsValue.groupId }],
    };

    if (context.propsValue.description) {
      companyData.description = context.propsValue.description;
    }
    
    if (context.propsValue.fundingRaised) {
      companyData.fundingRaised = context.propsValue.fundingRaised;
    }
    
    if (context.propsValue.employeeRange) {
      companyData.employeeRange = context.propsValue.employeeRange;
    }
    
    if (context.propsValue.foundationYear) {
      companyData.linkedin = context.propsValue.foundationYear;
    }
    
    if (context.propsValue.industry) {
      companyData.industry = context.propsValue.industry;
    }
    
    if (context.propsValue.lastFundingDate) {
      companyData.lastFundingDate =context.propsValue.lastFundingDate;
    }

    try {
      const response = await makeFolkRequest<FolkCompany>(
        context.auth,
        HttpMethod.POST,
        '/companies',
        companyData
      );

      return {
        success: true,
        company: response,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.body?.error?.message || error.message || 'Failed to create company',
        details: error.response?.body?.error?.details,
      };
    }
  },
});