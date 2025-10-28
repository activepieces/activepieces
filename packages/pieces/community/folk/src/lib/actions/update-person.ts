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
    fullName: Property.ShortText({
      displayName: 'Full Name',
      description: 'Full name of the person',
      required: false,
    }),
    emails: Property.Array({
      displayName: 'Email',
      description: 'A list of email addresses associated with the person. The first email address in the list will be the persons primary email address.',
      required: false,
    }),
    phones: Property.Array({
      displayName: 'Phone',
      description: 'A list of phone numbers associated with the person. The first phone number in the list will be the persons primary phone number.',
      required: false,
    }),
    birthday: Property.DateTime({
      displayName: 'Birthday',
      description: 'The birthday of the person, in ISO format.',
      required: false,
    }),
    jobTitle: Property.ShortText({
      displayName: 'Job Title',
      description: 'Job title or position',
      required: false,
    }),
    companies: Property.Array({
      displayName: 'Companies',
      description: 'The companies associated with the person. You can either provide a name or an id. If you provide a name, the company will be created if it does not already exist. The first company in the list will be the persons primary company.',
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
    if (context.propsValue.emails) updateData.emails = context.propsValue.emails;
    if (context.propsValue.phones) updateData.phones = context.propsValue.phones;
    if (context.propsValue.birthday) updateData.birthday = context.propsValue.birthday;
    if (context.propsValue.jobTitle) updateData['job title'] = context.propsValue.jobTitle;
    if (context.propsValue.companies) updateData.companies = context.propsValue.companies;
    if (context.propsValue.lastName) updateData.lastName = context.propsValue.lastName;
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