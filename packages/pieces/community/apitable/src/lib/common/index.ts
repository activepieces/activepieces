import { DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';

export const APITableCommon = {
  datasheet: Property.ShortText({
    displayName: 'Datasheet ID',
    description:
      'The datasheet to watch for new records, obtain it from the url',
    required: true,
  }),
  fields: Property.DynamicProperties({
    displayName: 'Fields',
    description: 'The fields to add to the record.',
    required: true,
    refreshers: ['auth', 'datasheet'],
    props: async ({ auth, datasheet }) => {
      const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `${auth['apiTableUrl'].replace(
          /\/$/,
          ''
        )}/fusion/v1/datasheets/${datasheet}/fields`,
        headers: {
          Authorization: 'Bearer ' + auth['token'],
        },
      };

      const res = await httpClient.sendRequest<{
        data: {
          fields: {
            id: string;
            name: string;
            type: string;
            desc: string;
            property?: {
              defaultValue?: string;
              options?: {
                name: string;
              }[];
            };
          }[];
        };
      }>(request);

      const props: DynamicPropsValue = {};

      res.body.data.fields.forEach((field) => {
        if (field.type === 'SingleSelect') {
          props[field.name] = Property.StaticDropdown({
            displayName: field.name,
            required: false,
            options: {
              options:
                field.property?.options?.map((option) => {
                  return {
                    label: option.name,
                    value: option.name,
                  };
                }) || [],
            },
          });
        } else if (field.type === 'MultiSelect') {
          props[field.name] = Property.StaticMultiSelectDropdown({
            displayName: field.name,
            required: false,
            options: {
              options:
                field.property?.options?.map((option) => {
                  return {
                    label: option.name,
                    value: option.name,
                  };
                }) || [],
            },
          });
        } else if (
          ![
            'MagicLink',
            'MagicLookUp',
            'Formula',
            'AutoNumber',
            'CreatedTime',
            'LastModifiedTime',
            'CreatedBy',
            'LastModifiedBy',
            'Attachment',
            'Member',
          ].includes(field.type)
        ) {
          props[field.name] = Property.ShortText({
            displayName: field.name,
            required: false,
          });
        }
      });

      return props;
    },
  }),
};
