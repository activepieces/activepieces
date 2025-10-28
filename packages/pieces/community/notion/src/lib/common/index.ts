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
    description:
      'Choose the Notion database you want to work with from your workspace',
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
  database_item_id: Property.Dropdown({
    displayName: 'Database Item',
    description: 'Select the item you want to update',
    required: true,
    refreshers: ['database_id'],
    options: async ({ auth, database_id }) => {
      if (!auth || !database_id) {
        return {
          disabled: true,
          placeholder:
            'Please connect your Notion account first and select database',
          options: [],
        };
      }
      const notion = new Client({
        auth: (auth as OAuth2PropertyValue).access_token,
        notionVersion: '2022-02-22',
      });
      const { results } = await notion.databases.query({
        database_id: database_id as string,
        filter_properties: ['title'],
      });
      return {
        disabled: false,
        options: results.map((item: any) => {
          const property: any = Object.values(item.properties)[0];
          return {
            label: property.title[0]?.plain_text ?? 'No Title',
            value: item.id,
          };
        }),
      };
    },
  }),
  archived_database_item_id: Property.Dropdown({
    displayName: 'Archived Item',
    description:
      'Choose which archived item to restore from the selected database',
    required: true,
    refreshers: ['database_id'],
    options: async ({ auth, database_id }) => {
      if (!auth || !database_id) {
        return {
          disabled: true,
          placeholder:
            'Please connect your Notion account first and select a database',
          options: [],
        };
      }

      try {
        const notion = new Client({
          auth: (auth as OAuth2PropertyValue).access_token,
          notionVersion: '2022-02-22',
        });

        const { results } = await notion.databases.query({
          database_id: database_id as string,
          filter_properties: ['title'],
          archived: true, // Only fetch archived items
        });

        if (results.length === 0) {
          return {
            disabled: false,
            options: [],
            placeholder: 'No archived items found in this database',
          };
        }

        return {
          disabled: false,
          placeholder: 'Select an archived item to restore',
          options: results.map((item: any) => {
            const property: any = Object.values(item.properties)[0];
            const title = property?.title?.[0]?.plain_text || 'Untitled';
            return {
              label: `${title} (archived)`,
              value: item.id,
            };
          }),
        };
      } catch (error: any) {
        return {
          disabled: true,
          placeholder:
            'Error loading archived items. Please check your database permissions.',
          options: [],
        };
      }
    },
  }),
  databaseFields: Property.DynamicProperties({
    displayName: 'Fields',
    required: true,
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
        for (const key in properties) {
          try {
            const property = properties[key];
            if (
              [
                'rollup',
                'button',
                'files',
                'verification',
                'formula',
                'unique_id',
                'relation',
                'created_by',
                'created_time',
                'last_edited_by',
                'last_edited_time',
              ].includes(property.type)
            ) {
              continue;
            }
            if (property.type === 'people') {
              const { results } = await notion.users.list({ page_size: 100 });
              fields[property.name] = Property.StaticMultiSelectDropdown({
                displayName: property.name,
                required: false,
                options: {
                  disabled: false,
                  options: results
                    .filter(
                      (user) => user.type === 'person' && user.name !== null
                    )
                    .map((option: { id: string; name: any }) => {
                      return {
                        label: option.name,
                        value: option.id,
                      };
                    }),
                },
              });
            } else {
              fields[property.name] =
                NotionFieldMapping[property.type].buildActivepieceType(
                  property
                );
            }
          } catch (e) {
            console.error(
              'Notion: could not generate dynamic input property',
              e
            );
          }
        }
      } catch (e) {
        console.debug(e);
      }
      return fields;
    },
  }),
  filterDatabaseFields: Property.DynamicProperties({
    displayName: 'Fields',
    required: true,
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

        for (const key in properties) {
          const property = properties[key];
          if (
            [
              'rollup',
              'button',
              'files',
              'verification',
              'status',
              'multi_select',
              'formula',
              'unique_id',
              'relation',
              'checkbox',
              'created_by',
              'created_time',
              'last_edited_by',
              'last_edited_time',
            ].includes(property.type)
          ) {
            continue;
          }
          fields[property.name] =
            NotionFieldMapping[property.type].buildActivepieceType(property);
        }
      } catch (e) {
        console.debug(e);
      }
      return fields;
    },
  }),

  page: Property.Dropdown<string>({
    displayName: 'Page',
    required: true,
    description:
      'Choose the Notion page you want to work with. This list shows your 100 most recently edited pages for easy selection.',
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Please connect your Notion account first',
          options: [],
        };
      }
      const pages = await getPages(auth as OAuth2PropertyValue);

      return {
        placeholder: 'Select a page',
        options: pages.map((page: any) => ({
          label:
            page.properties.Name?.title[0]?.plain_text ??
            page.properties.title?.title[0]?.text?.content ??
            'No Title',
          value: page.id,
        })),
      };
    },
  }),
};

export async function getPages(
  auth: OAuth2PropertyValue,
  search?: {
    editedAfter?: Date;
    createdAfter?: Date;
  },
  sort?: {
    property: string;
    direction: 'ascending' | 'descending';
  }
): Promise<any[]> {
  const notion = new Client({
    auth: auth.access_token,
    notionVersion: '2022-02-22',
  });

  let filter: any = {
    property: 'object',
    value: 'page',
  };
  if (search?.editedAfter)
    filter = {
      and: [
        {
          property: 'object',
          value: 'page',
        },
        {
          timestamp: 'last_edited_time',
          last_edited_time: {
            after: search.editedAfter,
          },
        },
      ],
    };
  if (search?.createdAfter)
    filter = {
      and: [
        {
          property: 'object',
          value: 'page',
        },
        {
          timestamp: 'created_time',
          created_time: {
            after: search.createdAfter,
          },
        },
      ],
    };

  const sortObj: any = {
    direction: sort?.direction ?? 'descending',
    timestamp: sort?.property ?? 'last_edited_time',
  };

  const pages = await notion.search({
    filter: filter,
    sort: sortObj,
  });
  return pages.results as any[];
}
