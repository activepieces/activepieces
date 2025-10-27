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
      description: 'Custom field values as JSON object (e.g., {"status": "active"})',
      required: false,
    }),
  },
  async run(context) {
    const updateData: any = {

    };

    if (context.propsValue.name) updateData.name = context.propsValue.name;
    if (context.propsValue.email) updateData.email = context.propsValue.email;
    if (context.propsValue.phone) updateData.phone = context.propsValue.phone;
    if (context.propsValue.website) updateData.website = context.propsValue.website;
    if (context.propsValue.linkedin) updateData.linkedin = context.propsValue.linkedin;
    if (context.propsValue.industry) updateData.industry = context.propsValue.industry;
    
    // Add custom fields directly to the root object
    if (context.propsValue.customFields) {
      Object.assign(updateData, context.propsValue.customFields);
    }

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