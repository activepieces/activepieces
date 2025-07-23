import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { systemeIoAuth } from '../common/auth';
import { systemeIoCommon } from '../common/client';
import { systemeIoProps } from '../common/props';

interface CustomField {
  fieldSlug: string;
  fieldValue: string;
}

export const updateContact = createAction({
  auth: systemeIoAuth,
  name: 'updateContact',
  displayName: 'Update Contact',
  description: 'Update an existing contact',
  props: {
    contactId: systemeIoProps.contactIdDropdown,
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'Contact first name',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'Contact last name',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Contact phone number',
      required: false,
    }),
    customFields: Property.Array({
      displayName: 'Custom Fields',
      description: 'Add custom fields with slug and value',
      required: false,
      properties: {
        fieldSlug: Property.ShortText({
          displayName: 'Field Slug',
          description: 'The unique identifier for this field (e.g., custom1, custom2, company)',
          required: true,
        }),
        fieldValue: Property.ShortText({
          displayName: 'Field Value',
          description: 'The value for this field',
          required: true,
        }),
      },
    }),
  },
  async run(context) {
    const { contactId, firstName, lastName, phone, customFields } = context.propsValue;
    
    const fields: any[] = [];
    
    if (firstName) {
      fields.push({
        slug: 'first_name',
        value: firstName
      });
    }
    
    if (lastName) {
      fields.push({
        slug: 'surname',
        value: lastName
      });
    }
    
    if (phone) {
      fields.push({
        slug: 'phone_number',
        value: phone
      });
    }

    if (customFields && Array.isArray(customFields)) {
      for (const customField of customFields as CustomField[]) {
        if (customField.fieldSlug && customField.fieldValue) {
          fields.push({
            slug: customField.fieldSlug,
            value: String(customField.fieldValue)
          });
        }
      }
    }

    const updateData: any = {};
    if (fields.length > 0) updateData.fields = fields;

    const response = await systemeIoCommon.apiCall({
      method: HttpMethod.PATCH,
      url: `/contacts/${contactId}`,
      body: updateData,
      auth: context.auth,
      headers: {
        'Content-Type': 'application/merge-patch+json',
      },
    });

    return {
      success: true,
      contactId,
      updatedFields: fields,
      customFieldsProcessed: customFields ? customFields.length : 0,
      response,
    };
  },
});
