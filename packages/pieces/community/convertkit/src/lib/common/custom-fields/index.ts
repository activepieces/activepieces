import { Property, DynamicPropsValue } from '@activepieces/pieces-framework';
import { CustomField } from '../types';
import { fetchCustomFields } from '../service';
import { convertkitAuth } from '../../auth';

export const fieldsArray = Property.Array({
  displayName: 'Field Labels',
  description: 'One label per new custom field.',
  required: true,
});

export const label = Property.Dropdown({
  auth: convertkitAuth,
  displayName: 'Custom Field',
  required: true,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your account first',
        options: [],
      };
    }

    const fields: CustomField[] = await fetchCustomFields(auth.secret_text);

    // loop through data and map to options
    const options = fields.map(
      (field: { id: string; label: string; key: string; name: string }) => {
        return {
          label: field.label,
          value: field.id,
        };
      }
    );

    return {
      options,
    };
  },
});

export const new_label = Property.ShortText({
  displayName: 'New Label',
  description: 'The name shown for this field in Kit.',
  required: true,
});

export const allFields = Property.DynamicProperties({
  auth: convertkitAuth,
  displayName: 'Custom Fields',
  description: 'Values for your Kit custom fields.',
  required: false,
  refreshers: ['auth'],
  props: async ({ auth }) => {
    if (!auth) {
      return {};
    }

    const fields: DynamicPropsValue = {};

    const customFields: CustomField[] = await fetchCustomFields(
      auth.secret_text
    );

    // loop through data and map to fields
    customFields.forEach(
      (field: { id: string; label: string; key: string; name: string }) => {
        fields[field.key] = Property.ShortText({
          displayName: field.label,
          description: `Enter the value for custom field: ${field.label}`,
          required: false,
        });
      }
    );

    return fields;
  },
});
