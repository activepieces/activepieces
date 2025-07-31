import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { aircallAuth } from '../common/auth';
import { makeClient } from '../common/client';

export const updateContactAction = createAction({
  auth: aircallAuth,
  name: 'update_contact',
  displayName: 'Update Contact',
  description: 'Updates an existing contact',
  props: {
    contactId: Property.Number({
      displayName: 'Contact ID',
      description: 'The ID of the contact to update',
      required: true,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'The contact\'s first name',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'The contact\'s last name',
      required: false,
    }),
    companyName: Property.ShortText({
      displayName: 'Company Name',
      description: 'The contact\'s company name',
      required: false,
    }),
    information: Property.LongText({
      displayName: 'Information',
      description: 'Additional information about the contact',
      required: false,
    }),
  },
  async run(context) {
    // Validate inputs
    if (!context.propsValue.contactId || context.propsValue.contactId <= 0) {
      throw new Error('Contact ID must be a positive number');
    }

    // Validate optional fields if provided
    if (context.propsValue.firstName && context.propsValue.firstName.length > 50) {
      throw new Error('First name cannot exceed 50 characters');
    }

    if (context.propsValue.lastName && context.propsValue.lastName.length > 50) {
      throw new Error('Last name cannot exceed 50 characters');
    }

    if (context.propsValue.companyName && context.propsValue.companyName.length > 100) {
      throw new Error('Company name cannot exceed 100 characters');
    }

    if (context.propsValue.information && context.propsValue.information.length > 500) {
      throw new Error('Information cannot exceed 500 characters');
    }

    // Check if at least one field is provided for update
    if (!context.propsValue.firstName && !context.propsValue.lastName && 
        !context.propsValue.companyName && !context.propsValue.information) {
      throw new Error('At least one field must be provided for update');
    }

    const client = makeClient({
      apiToken: context.auth.apiToken,
      baseUrl: context.auth.baseUrl || 'https://api.aircall.io/v1',
    });

    const body: Record<string, unknown> = {};

    if (context.propsValue.firstName) {
      body['first_name'] = context.propsValue.firstName.trim();
    }

    if (context.propsValue.lastName) {
      body['last_name'] = context.propsValue.lastName.trim();
    }

    if (context.propsValue.companyName) {
      body['company_name'] = context.propsValue.companyName.trim();
    }

    if (context.propsValue.information) {
      body['information'] = context.propsValue.information.trim();
    }

    try {
      const response = await client.makeRequest({
        method: HttpMethod.PUT,
        url: `/contacts/${context.propsValue.contactId}`,
        body,
      });

      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (error && typeof error === 'object' && 'response' in error) {
        const response = (error as { response: { status: number } }).response;
        if (response.status === 404) {
          throw new Error(`Contact with ID ${context.propsValue.contactId} not found`);
        }
        if (response.status === 400) {
          throw new Error('Invalid request. Please check your input parameters.');
        }
      }
      throw new Error(`Failed to update contact: ${errorMessage}`);
    }
  },
}); 