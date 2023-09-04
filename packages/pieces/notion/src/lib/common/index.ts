import {
  OAuth2PropertyValue,
  Property,
  DynamicPropsValue,
} from '@activepieces/pieces-framework';
import { Client } from '@notionhq/client';
import { NotionFieldMapping } from './models';
export const notionCommon = {
  baseUrl: 'https://api.notion.com/v1',
  database_id: Property.Dropdown<string>({
    displayName: 'Database',
    required: true,
    description: 'Select the database you want to use',
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Please connect your Notion account first',
          options: [],
        };
      }
      const notion = new Client({
        auth: (auth as OAuth2PropertyValue).access_token,
        notionVersion: '2022-02-22',
      });
      const databases = await notion.search({
        filter: {
          property: 'object',
          value: 'database',
        },
      });
      return {
        placeholder: 'Select a database',
        options: databases.results
          .filter((f: any) => f.title.length > 0)
          .map((database: any) => ({
            label: database.title?.[0]?.plain_text ?? 'Unknown title',
            value: database.id,
          })),
      };
    },
  }),
  databaseFields: (required = true) =>
    Property.DynamicProperties({
      displayName: 'Fields',
      required,
      refreshers: ['database_id'],
      props: async ({ auth, database_id }) => {
        if (!auth || !database_id) {
          return {
            disabled: true,
            placeholder:
              'Please connect your Notion account first and select database',
            options: [],
          };
        }
        const fields: DynamicPropsValue = {};
        try {
          const notion = new Client({
            auth: (auth as OAuth2PropertyValue).access_token,
            notionVersion: '2022-02-22',
          });
          const { properties } = await notion.databases.retrieve({
            database_id: database_id as unknown as string,
          });
          //   Object.keys(database.properties).forEach((property:DatabaseProperty) => {
          //     if (property.type )
          //   });
          //
          for (var key in properties) {
            if (properties.hasOwnProperty(key)) {
              var property = properties[key];
              if (
                ![
                  'rollup',
                  'relation',
                  'created_by',
                  'created_time',
                  'last_edited_by',
                  'last_edited_time ',
                ].includes(property.type)
              ) {
                continue;
              }
              const params = {
                displayName: key,
                required: false,
              };
              if (property.type === 'select') {
                const options = property.select.options.map(
                  (option: { id: string; name: string }) => ({
                    value: option.id,
                    label: option.name,
                  })
                );
                fields[property.id] = NotionFieldMapping[property.type]({
                  ...params,
                  options: {
                    options: options ?? [],
                  },
                });
              } else if (property.type === 'multi_select') {
                const options = property.multi_select.options.map(
                  (option: { id: string; name: string }) => ({
                    value: option.id,
                    label: option.name,
                  })
                );
                fields[property.id] = NotionFieldMapping[property.type]({
                  ...params,
                  options: {
                    options: options ?? [],
                  },
                });
              } else {
                fields[property.id] = NotionFieldMapping[property.type](params);
              }
            }
          }
        } catch (e) {
          console.debug(e);
        }
        return fields;
      },
    }),
};
