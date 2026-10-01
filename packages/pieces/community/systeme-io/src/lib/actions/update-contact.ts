import { createAction, InputPropertyMap, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { systemeIoAuth } from '../common/auth';
import { systemeIoCommon, systemeIoInput } from '../common/client';
import { systemeIoProps } from '../common/props';
import { updateContactActionOutputSchema } from '../output-schemas';
import { contactLocaleOptions, optionalLocale } from '../common/dropdowns';

export const updateContact = createAction({
  auth: systemeIoAuth,
  name: 'updateContact',
  classification: 'WRITE',
  displayName: 'Update Contact',
  description: 'Update fields (name, phone, custom fields) of an existing contact using fields from your Systeme.io account',
  audience: 'human',
  aiMetadata: { description: 'Updates fields of an existing Systeme.io contact, identified by contact id, via a partial merge-patch of standard, account-defined, and manually-keyed custom fields (an empty value clears a field), plus an optional language change. Use to change a known contact\'s data such as name, phone, or custom attributes. Idempotent: applying the same field values yields the same result; only the provided fields are touched, and a call with no fields makes no change.', idempotent: true },
  props: {
    contactId: systemeIoProps.contactIdDropdown,
    dynamicContactFields: Property.DynamicProperties({
      auth: systemeIoAuth,
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
            auth: auth.secret_text,
          });

          const dynamicProps: InputPropertyMap = {};

          for (const field of contactFieldsOf(response)) {
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
    locale: Property.StaticDropdown({
      displayName: 'Language',
      description: 'Optional. Change the contact\'s preferred language. Leave empty to keep the current language.',
      required: false,
      options: {
        disabled: false,
        options: contactLocaleOptions,
      },
    }),
  },
  outputSchema: updateContactActionOutputSchema,
  async run(context) {
    const { 
      contactId, 
      dynamicContactFields,
      customFields,
      locale,
    } = context.propsValue;
    
    const fields: { slug: string; value: string | null }[] = [];
    
    if (dynamicContactFields && typeof dynamicContactFields === 'object') {
      const fieldsObj: Record<string, unknown> = dynamicContactFields;
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
      for (const customField of customFields) {
        const slug: unknown = isRecord(customField) ? customField['fieldSlug'] : undefined;
        const fieldValue: unknown = isRecord(customField) ? customField['fieldValue'] : undefined;
        if (typeof slug === 'string' && slug !== '') {
          fields.push({
            slug,
            value: fieldValue ? String(fieldValue) : null
          });
        }
      }
    }

    const localeValue = optionalLocale(locale);
    const updateData = {
      ...(fields.length > 0 ? { fields } : {}),
      ...(localeValue !== undefined ? { locale: localeValue } : {}),
    };

    if (Object.keys(updateData).length === 0) {
      return {
        success: false,
        message: 'No fields provided to update',
        contactId,
      };
    }

    const response = await systemeIoCommon.apiCall({
      method: HttpMethod.PATCH,
      url: `/contacts/${systemeIoInput.requireId({ value: contactId, name: 'Contact ID' })}`,
      body: updateData,
      auth: context.auth.secret_text,
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function contactFieldsOf(response: unknown): { slug: string; fieldName?: string }[] {
  const items: unknown = Array.isArray(response) ? response : isRecord(response) ? response['items'] : undefined;
  if (!Array.isArray(items)) {
    return [];
  }
  return items.flatMap((item: unknown) => {
    if (!isRecord(item) || typeof item['slug'] !== 'string') {
      return [];
    }
    const fieldName = item['fieldName'];
    return [{ slug: item['slug'], fieldName: typeof fieldName === 'string' ? fieldName : undefined }];
  });
}
