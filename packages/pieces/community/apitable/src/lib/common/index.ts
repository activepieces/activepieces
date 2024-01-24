import {
  DynamicPropsValue,
  PiecePropValueSchema,
  Property,
} from '@activepieces/pieces-framework';
import { APITableAuth } from '../../';
import { AITableClient } from './client';

export function makeClient(auth: PiecePropValueSchema<typeof APITableAuth>) {
  const client = new AITableClient(auth.apiTableUrl, auth.token);
  return client;
}

export const APITableCommon = {
  space_id: Property.Dropdown({
    displayName: 'Space',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Connect your account first',
        };
      }
      const client = makeClient(
        auth as PiecePropValueSchema<typeof APITableAuth>
      );
      const res = await client.listSpaces();
      return {
        disabled: false,
        options: res.data.spaces.map((space) => {
          return {
            label: space.name,
            value: space.id,
          };
        }),
      };
    },
  }),
  datasheet_id: Property.Dropdown({
    displayName: 'Datasheet',
    required: true,
    refreshers: ['space_id'],
    options: async ({ auth, space_id }) => {
      if (!auth || !space_id) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Connect your account first and select space.',
        };
      }
      const client = makeClient(
        auth as PiecePropValueSchema<typeof APITableAuth>
      );
      const res = await client.listDatasheets(space_id as string);
      return {
        disabled: false,
        options: res.data.nodes.map((datasheet) => {
          return {
            label: datasheet.name,
            value: datasheet.id,
          };
        }),
      };
    },
  }),
  fields: Property.DynamicProperties({
    displayName: 'Fields',
    description: 'The fields to add to the record.',
    required: true,
    refreshers: ['auth', 'datasheet_id'],
    props: async ({ auth, datasheet_id }) => {
      const client = makeClient(
        auth as PiecePropValueSchema<typeof APITableAuth>
      );
      const res = await client.getDatasheetFields(
        datasheet_id as unknown as string
      );

      const props: DynamicPropsValue = {};

      res.data.fields.forEach((field) => {
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
            'Cascader',
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

export async function createNewFields(
  auth: PiecePropValueSchema<typeof APITableAuth>,
  datasheet_id: string,
  fields: Record<string, unknown>
) {
  if (!auth) return fields;
  if (!datasheet_id) return fields;

  const newFields: Record<string, unknown> = {};

  const client = makeClient(auth as PiecePropValueSchema<typeof APITableAuth>);
  const res = await client.getDatasheetFields(datasheet_id as string);

  res.data.fields.forEach((field) => {
    if (
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
        'Cascader',
      ].includes(field.type) &&
      field.name in fields
    ) {
      const key = field.name;
      if (field.type === 'Number') {
        newFields[key] = Number(fields[key]);
      } else {
        newFields[key] = fields[key];
      }
    }
  });
  return newFields;
}
