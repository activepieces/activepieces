import { Property } from '@activepieces/pieces-framework';
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
        }
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
                    rows_per_page: '1000'
                }
            });

            return {
                disabled: false,
                options: response.records.map((record) => {
                    const label = record[displayField] || record.id;
                    return {
                        label: label,
                        value: record.id,
                    }
                }),
            };
        } catch (error: any) {
            return {
                disabled: true,
                placeholder: `Error loading records: ${error.message}`,
                options: [],
            }
        }
    },
});
