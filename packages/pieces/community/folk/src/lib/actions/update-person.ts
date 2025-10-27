import { createAction, Property } from '@activepieces/pieces-framework';
import { makeFolkRequest, FolkPerson, folkAuth } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';

export const updatePersonAction = createAction({
  auth: folkAuth,
  name: 'update_person',
  displayName: 'Update Person',
  description: 'Updates a person contact in a folk group',
  props: {
    personId: Property.ShortText({
      displayName: 'Person ID',
      description: 'ID of the person to update',
      required: true,
    }),
    fullName: Property.ShortText({
      displayName: 'Full Name',
      description: 'Full name of the person',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Primary email address',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Primary phone number',
      required: false,
    }),
    linkedin: Property.ShortText({
      displayName: 'LinkedIn URL',
      description: 'LinkedIn profile URL',
      required: false,
    }),
    jobTitle: Property.ShortText({
      displayName: 'Job Title',
      description: 'Job title or position',
      required: false,
    }),
    companyId: Property.ShortText({
      displayName: 'Company ID',
      description: 'Associated company contact ID',
      required: false,
    }),
    customFields: Property.Json({
      displayName: 'Custom Fields',
      description: 'Custom field values as JSON object (e.g., {"status": "active"})',
      required: false,
    }),
  },
  async run(context) {
    const updateData: any = {};

    if (context.propsValue.fullName) updateData.fullName = context.propsValue.fullName;
    if (context.propsValue.email) updateData.email = context.propsValue.email;
    if (context.propsValue.phone) updateData.phone = context.propsValue.phone;
    if (context.propsValue.linkedin) updateData.linkedin = context.propsValue.linkedin;
    if (context.propsValue.jobTitle) updateData['job title'] = context.propsValue.jobTitle;
    if (context.propsValue.companyId) updateData.company = context.propsValue.companyId;
    
    // Add custom fields directly to the root object
    if (context.propsValue.customFields) {
      Object.assign(updateData, context.propsValue.customFields);
    }

    try {
      const response = await makeFolkRequest<FolkPerson>(
        context.auth,
        HttpMethod.PATCH,
        `/people/${context.propsValue.personId}`,
        updateData
      );

      return {
        success: true,
        person: response,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.body?.error?.message || error.message || 'Failed to update person',
        details: error.response?.body?.error?.details,
      };
    }
  },
});