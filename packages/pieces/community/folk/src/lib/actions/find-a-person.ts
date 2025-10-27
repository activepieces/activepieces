import { createAction, Property } from '@activepieces/pieces-framework';
import { makeFolkRequest, FolkPerson, folkAuth } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';

export const findPersonAction = createAction({
  auth: folkAuth,
  name: 'find_person',
  displayName: 'Find a Person',
  description: 'Finds a person by matching their full name or one of their emails',
  props: {
    name: Property.ShortText({
      displayName: 'Full Name',
      description: 'Search by full name',
      required: false,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'Search by first name',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'Search by last name',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Search by email address',
      required: false,
    }),
    jobTitle: Property.ShortText({
      displayName: 'Job Title',
      description: 'Search by job title',
      required: false,
    }),
    companyId: Property.ShortText({
      displayName: 'Company ID',
      description: 'Filter by associated company',
      required: false,
    }),
    groupId: Property.ShortText({
      displayName: 'Group ID',
      description: 'Filter by specific group',
      required: false,
    }),
  },
  async run(context) {
    try {
      const queryParams: Record<string, string> = {
        type: 'person',
      };

      if (context.propsValue.name) {
        queryParams['name'] = context.propsValue.name;
      }
      if (context.propsValue.firstName) {
        queryParams['first_name'] = context.propsValue.firstName;
      }
      if (context.propsValue.lastName) {
        queryParams['last_name'] = context.propsValue.lastName;
      }
      if (context.propsValue.email) {
        queryParams['email'] = context.propsValue.email;
      }
      if (context.propsValue.jobTitle) {
        queryParams['job_title'] = context.propsValue.jobTitle;
      }
      if (context.propsValue.companyId) {
        queryParams['company_id'] = context.propsValue.companyId;
      }
      if (context.propsValue.groupId) {
        queryParams['group_id'] = context.propsValue.groupId;
      }

      const response = await makeFolkRequest<{ contacts: FolkPerson[]; meta: { total: number } }>(
        context.auth,
        HttpMethod.GET,
        '/people',
        queryParams
      );

      return {
        success: true,
        people: response.contacts,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to find person',
        people: [],
        count: 0,
      };
    }
  },
});