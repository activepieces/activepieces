import { Property, DynamicPropsValue } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { knackApiCall, KnackAuthProps } from './client';

interface KnackObject {
  key: string;
  name: string;
}

interface KnackObjectDetails extends KnackObject {
  display_field: string;
}

interface KnackRecord {
  id: string;
  [key: string]: any;
}

export const objectDropdown = Property.Dropdown({
  displayName: 'Object',
  description: 'The object (table) to perform the action on.',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please authenticate first.',
        options: [],
      };
    }

    const typedAuth = auth as KnackAuthProps;

    try {
      const response = await knackApiCall<{ objects: KnackObject[] }>({
        method: HttpMethod.GET,
        auth: typedAuth,
        resourceUri: '/objects',
      });

      return {
        disabled: false,
        options: response.objects.map((object) => ({
          label: object.name,
          value: object.key,
        })),
      };
    } catch (error: any) {
      return {
        disabled: true,
        placeholder: `Error loading objects: ${error.message}`,
        options: [],
      };
    }
  },
});

export const recordIdDropdown = Property.Dropdown({
  displayName: 'Record',
  description: 'Select the record to perform the action on.',
  required: true,
  refreshers: ['object'],
  options: async ({ auth, object }) => {
    if (!auth || !object) {
      return {
        disabled: true,
        placeholder: 'Select an object first.',
        options: [],
      };
    }

    const typedAuth = auth as KnackAuthProps;
    const objectKey = object as string;

    try {
      const objectDetails = await knackApiCall<KnackObjectDetails>({
        method: HttpMethod.GET,
        auth: typedAuth,
        resourceUri: `/objects/${objectKey}`,
      });
      const displayField = objectDetails.display_field;

      const response = await knackApiCall<{ records: KnackRecord[] }>({
        method: HttpMethod.GET,
        auth: typedAuth,
        resourceUri: `/objects/${objectKey}/records`,
        query: {
          rows_per_page: '1000',
        },
      });

      return {
        disabled: false,
        options: response.records.map((record) => {
          const displayValue = record[displayField];
          const label = displayValue
            ? `${displayValue} (ID: ${record.id})`
            : `Record ${record.id}`;
          return {
            label: label,
            value: record.id,
          };
        }),
      };
    } catch (error: any) {
      return {
        disabled: true,
        placeholder: `Error loading records: ${error.message}`,
        options: [],
      };
    }
  },
});

export const dynamicRecordFields = Property.DynamicProperties({
  displayName: 'Record Fields',
  description:
    'Edit the record fields. Field types are automatically configured based on the record structure.',
  required: true,
  refreshers: ['object', 'recordId'],
  props: async ({ auth, object, recordId }) => {
    if (!auth || !object || !recordId) {
      return {};
    }

    const typedAuth = auth as KnackAuthProps;
    const objectKey = object as unknown as string;
    const recordIdValue = recordId as unknown as string;

    try {
      const recordResponse = await knackApiCall<any>({
        method: HttpMethod.GET,
        auth: typedAuth,
        resourceUri: `/objects/${objectKey}/records/${recordIdValue}`,
      });

      const props: DynamicPropsValue = {};

      for (const [fieldKey, fieldValue] of Object.entries(recordResponse)) {
        if (fieldKey === 'id') {
          continue;
        }

        if (fieldKey.endsWith('_raw')) {
          continue;
        }

        const rawFieldKey = `${fieldKey}_raw`;
        const hasRawField = recordResponse.hasOwnProperty(rawFieldKey);
        const rawValue = hasRawField ? recordResponse[rawFieldKey] : null;

        const displayName = fieldKey
          .replace(/^field_/, 'Field ')
          .replace(/_/g, ' ');
        const description = `Enter value for ${displayName}`;

        if (hasRawField && rawValue && typeof rawValue === 'object') {
          if (
            rawValue.hasOwnProperty('street') &&
            rawValue.hasOwnProperty('city')
          ) {
            props[`${fieldKey}_street`] = Property.ShortText({
              displayName: `${displayName} - Street`,
              description: 'Street address',
              required: false,
              defaultValue: rawValue.street || '',
            });
            props[`${fieldKey}_city`] = Property.ShortText({
              displayName: `${displayName} - City`,
              description: 'City',
              required: false,
              defaultValue: rawValue.city || '',
            });
            props[`${fieldKey}_state`] = Property.ShortText({
              displayName: `${displayName} - State`,
              description: 'State',
              required: false,
              defaultValue: rawValue.state || '',
            });
            props[`${fieldKey}_zip`] = Property.ShortText({
              displayName: `${displayName} - ZIP`,
              description: 'ZIP code',
              required: false,
              defaultValue: rawValue.zip || '',
            });
          } else if (rawValue.hasOwnProperty('url')) {
            props[fieldKey] = Property.ShortText({
              displayName: displayName,
              description: `${description} (URL)`,
              required: false,
              defaultValue: rawValue.url || '',
            });
          } else if (rawValue.hasOwnProperty('email')) {
            props[fieldKey] = Property.ShortText({
              displayName: displayName,
              description: `${description} (Email)`,
              required: false,
              defaultValue: rawValue.email || '',
            });
          } else if (rawValue.hasOwnProperty('number')) {
            props[fieldKey] = Property.ShortText({
              displayName: displayName,
              description: `${description} (Phone)`,
              required: false,
              defaultValue: rawValue.number || rawValue.full || '',
            });
          } else if (Array.isArray(rawValue)) {
          } else {
          }
        } else {
          const stringValue = String(fieldValue || '');
          if (
            fieldKey.includes('email') ||
            (typeof fieldValue === 'string' && fieldValue.includes('@'))
          ) {
            props[fieldKey] = Property.ShortText({
              displayName: displayName,
              description: `${description} (Email)`,
              required: false,
              defaultValue: stringValue,
            });
          } else if (fieldKey.includes('phone') || fieldKey.includes('tel')) {
            props[fieldKey] = Property.ShortText({
              displayName: displayName,
              description: `${description} (Phone)`,
              required: false,
              defaultValue: stringValue,
            });
          } else if (fieldKey.includes('date') || fieldKey.includes('time')) {
            props[fieldKey] = Property.DateTime({
              displayName: displayName,
              description: `${description} (Date/Time)`,
              required: false,
              defaultValue: stringValue || undefined,
            });
          } else if (
            typeof fieldValue === 'number' ||
            (!isNaN(Number(stringValue)) && stringValue !== '')
          ) {
            props[fieldKey] = Property.Number({
              displayName: displayName,
              description: `${description} (Number)`,
              required: false,
              defaultValue:
                typeof fieldValue === 'number'
                  ? fieldValue
                  : stringValue
                  ? Number(stringValue)
                  : undefined,
            });
          } else if (
            typeof fieldValue === 'boolean' ||
            stringValue.toLowerCase() === 'true' ||
            stringValue.toLowerCase() === 'false'
          ) {
            props[fieldKey] = Property.Checkbox({
              displayName: displayName,
              description: `${description} (Yes/No)`,
              required: false,
              defaultValue: Boolean(fieldValue),
            });
          } else if (stringValue.length > 100 || stringValue.includes('\n')) {
            props[fieldKey] = Property.LongText({
              displayName: displayName,
              description: description,
              required: false,
              defaultValue: stringValue,
            });
          } else {
            props[fieldKey] = Property.ShortText({
              displayName: displayName,
              description: description,
              required: false,
              defaultValue: stringValue,
            });
          }
        }
      }

      return props;
    } catch (error: any) {
      return {};
    }
  },
});
