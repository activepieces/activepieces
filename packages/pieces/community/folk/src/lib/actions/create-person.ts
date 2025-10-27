import { createAction, Property } from '@activepieces/pieces-framework';
import { makeFolkRequest, FolkPerson, folkAuth } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';
import { stringify } from 'querystring';

export const createPersonAction = createAction({
  auth: folkAuth,
  name: 'create_person',
  displayName: 'Create Person',
  description: 'Creates a new person contact in a folk group',
  props: {
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'First name of the person',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'Last name of the person',
      required: true,
    }),
    groupId: Property.ShortText({
      displayName: 'Group ID',
      description: 'ID of the group to add the person to',
      required: true,
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
      description: 'Custom field values as JSON object (e.g., {"status": "active", "priority": "high"})',
      required: false,
    }),
  },
  async run(context) {
    // Validate required fields
    if (!context.propsValue.groupId || context.propsValue.groupId.trim() === '') {
      return {
        success: false,
        error: 'Group ID is required',
      };
    }

    if (!context.propsValue.lastName || context.propsValue.lastName.trim() === '') {
      return {
        success: false,
        error: 'Last Name is required',
      };
    }

    // Construct full name
    const fullName = context.propsValue.firstName 
      ? `${context.propsValue.firstName.trim()} ${context.propsValue.lastName.trim()}`
      : context.propsValue.lastName.trim();

    const personData: any = {
      fullName: fullName,
      groups: [{ id: context.propsValue.groupId.trim() }],
    };

    // Add optional fields only if they have values
    if (context.propsValue.email && context.propsValue.email.trim()) {
      personData.email = context.propsValue.email.trim();
    }
    
    if (context.propsValue.phone && context.propsValue.phone.trim()) {
      personData.phone = context.propsValue.phone.trim();
    }
    
    if (context.propsValue.linkedin && context.propsValue.linkedin.trim()) {
      personData.linkedin = context.propsValue.linkedin.trim();
    }
    
    if (context.propsValue.jobTitle && context.propsValue.jobTitle.trim()) {
      personData.jobTitle = context.propsValue.jobTitle.trim();
    }
    
    if (context.propsValue.companyId && context.propsValue.companyId.trim()) {
      personData.company = context.propsValue.companyId.trim();
    }
    
    // Add custom fields directly to the root object
    if (context.propsValue.customFields && typeof context.propsValue.customFields === 'object') {
      Object.assign(personData, context.propsValue.customFields);
    }

    try {
      const response = await makeFolkRequest<FolkPerson>(
        context.auth,
        HttpMethod.POST,
        '/people',
        personData
      );

      return {
        success: true,
        person: response,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.body?.error?.message || error.message || 'Failed to create person',
        details: error.response?.body?.error?.details,
        requestBody: personData,
      };
    }
  },
});