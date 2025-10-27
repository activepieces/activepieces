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
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Company email address',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Company phone number',
      required: false,
    }),
    website: Property.ShortText({
      displayName: 'Website',
      description: 'Company website URL',
      required: false,
    }),
    linkedin: Property.ShortText({
      displayName: 'LinkedIn URL',
      description: 'Company LinkedIn URL',
      required: false,
    }),
    industry: Property.ShortText({
      displayName: 'Industry',
      description: 'Company industry',
      required: false,
    }),
    customFields: Property.Json({
      displayName: 'Custom Fields',
      description: 'Custom field values as JSON object (e.g., {"status": "active", "priority": "high"})',
      required: false,
    }),
  },
  async run(context) {
    const companyData: any = {
      name: context.propsValue.name,
      groups: [{ id: context.propsValue.groupId }],
    };

    // Only add fields if they have values
    if (context.propsValue.email) {
      companyData.email = context.propsValue.email;
    }
    
    if (context.propsValue.phone) {
      companyData.phone = context.propsValue.phone;
    }
    
    if (context.propsValue.website) {
      companyData.website = context.propsValue.website;
    }
    
    if (context.propsValue.linkedin) {
      companyData.linkedin = context.propsValue.linkedin;
    }
    
    if (context.propsValue.industry) {
      companyData.industry = context.propsValue.industry;
    }
    
    // Add custom fields directly to the root object
    if (context.propsValue.customFields) {
      Object.assign(companyData, context.propsValue.customFields);
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