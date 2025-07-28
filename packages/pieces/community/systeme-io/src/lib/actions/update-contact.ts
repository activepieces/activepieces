import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { systemeIoAuth } from '../common/auth';
import { systemeIoCommon } from '../common/client';
import { systemeIoProps } from '../common/props';

interface ContactFieldUpdate {
  field: string;
  value: string;
}

export const updateContact = createAction({
  auth: systemeIoAuth,
  name: 'updateContact',
  displayName: 'Update Contact',
  description: 'Update fields (name, phone, custom fields) of an existing contact using fields from your Systeme.io account',
  props: {
    contactId: systemeIoProps.contactIdDropdown,
    dynamicContactFields: Property.DynamicProperties({
      displayName: 'Contact Fields',
      description: 'Select which contact fields to update',
      required: false,
      refreshers: ['contactId'],
      props: async ({ auth, contactId }) => {
        if (!auth) {
          return {};
        }

        try {
          const response = await systemeIoCommon.getContactFields({
            auth: auth as unknown as string,
          });

          let fields: any[] = [];
          if (Array.isArray(response)) {
            fields = response;
          } else if (response && typeof response === 'object' && response !== null) {
            const responseAny = response as any;
            if (responseAny.items && Array.isArray(responseAny.items)) {
              fields = responseAny.items;
            }
          }

          const dynamicProps: any = {};

          for (const field of fields) {
            dynamicProps[field.slug] = Property.ShortText({
              displayName: field.fieldName || field.slug,
              description: `Update ${field.fieldName || field.slug} (leave empty to keep current value)`,
              required: false,
            });
          }

          return dynamicProps;
        } catch (error) {
          console.error('Error fetching contact fields:', error);
          return {};
        }
      },
    }),
    customFields: Property.Array({
      displayName: 'Custom Fields (Manual Entry)',
      description: 'Add or update custom fields with manual slug entry (use empty value to clear field)',
      required: false,
      properties: {
        fieldSlug: Property.ShortText({
          displayName: 'Field Slug',
          description: 'The unique identifier for this field (e.g., custom_field_1, my_field)',
          required: true,
        }),
        fieldValue: Property.ShortText({
          displayName: 'Field Value',
          description: 'The value for this field (leave empty to clear the field)',
          required: false,
        }),
      },
    }),
  },
  async run(context) {
    const { 
      contactId, 
      dynamicContactFields,
      customFields
    } = context.propsValue;
    
    const fields: any[] = [];
    
    if (dynamicContactFields && typeof dynamicContactFields === 'object') {
      const fieldsObj = dynamicContactFields as Record<string, any>;
      for (const key in fieldsObj) {
        if (Object.prototype.hasOwnProperty.call(fieldsObj, key)) {
          const value = fieldsObj[key];
          if (value !== undefined && value !== null && value !== '') {
            fields.push({
              slug: key,
              value: String(value)
            });
          }
        }
      }
    }

    if (customFields && Array.isArray(customFields)) {
      for (const customField of customFields as any[]) {
        if (customField.fieldSlug) {
          fields.push({
            slug: customField.fieldSlug,
            value: customField.fieldValue || null
          });
        }
      }
    }

    const updateData: any = {};
    if (fields.length > 0) updateData.fields = fields;

    if (Object.keys(updateData).length === 0) {
      return {
        success: false,
        message: 'No fields provided to update',
        contactId,
      };
    }

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
      dynamicFieldsProcessed: dynamicContactFields ? Object.keys(dynamicContactFields).filter(key => 
        dynamicContactFields[key] !== undefined && 
        dynamicContactFields[key] !== null && 
        dynamicContactFields[key] !== ''
      ).length : 0,
      response,
    };
  },
});
