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
    description: Property.ShortText({
      displayName: 'Description',
      description: 'A short description of the person.',
      required: false,
    }),
    birthday: Property.DateTime({
      displayName: 'Birthday',
      description: 'The birthday of the person, in ISO format.',
      required: false,
    }),
    emails: Property.Array({
      displayName: 'Email',
      description: 'A list of email addresses associated with the person. The first email address in the list will be the persons primary email address.',
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
    phones: Property.Array({
      displayName: 'Phones',
      description: 'A list of phone numbers associated with the person. The first phone number in the list will be the persons primary phone number.',
      required: false,
    }),
    customFields: Property.Json({
      displayName: 'Custom Fields',
      description: 'Custom field values as JSON object (e.g., {"status": "active", "priority": "high"})',
      required: false,
    }),
  },
  async run(context) {
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

    if (context.propsValue.emails) {
      personData.emails = context.propsValue.emails;
    }
    
    if (context.propsValue.birthday) {
      personData.phone = context.propsValue.birthday;
    }
    
    if (context.propsValue.description) {
      personData.description = context.propsValue.description;
    }
    
    if (context.propsValue.jobTitle) {
      personData.jobTitle = context.propsValue.jobTitle.trim();
    }
    
    if (context.propsValue.companyId) {
      personData.companyId = context.propsValue.companyId;
    }

     if (context.propsValue.phones) {
      personData.phones = context.propsValue.phones;
    }
    
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