import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import {
  AppConnectionValueForAuthProperty,
  Property,
  DynamicPropsValue,
} from '@activepieces/pieces-framework';
import { AppConnectionType } from '@activepieces/pieces-framework';
import { Client } from '@notionhq/client';
import { NotionFieldMapping } from './models';
import { notionAuth } from '../auth';

export type NotionAuthValue = AppConnectionValueForAuthProperty<
  typeof notionAuth
>;

export function getNotionToken(auth: NotionAuthValue): string {
  if (auth.type === AppConnectionType.CUSTOM_AUTH) {
    return auth.props.accessToken;
  }
  return getAccessTokenOrThrow(auth);
}

export const notionCommon = {
  baseUrl: 'https://api.notion.com/v1',
  database_id: Property.Dropdown<string, true, typeof notionAuth>({
    auth: notionAuth,
    displayName: 'Database',
    required: true,
    description: 'Only databases shared with your integration are listed.',
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your Notion account first',
          options: [],
        };
      }
      const notion = new Client({
        auth: getNotionToken(auth as NotionAuthValue),
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
    auth: notionAuth,
    displayName: 'Database Item',
    description: 'Items in the selected database, listed by title.',
    required: true,
    refreshers: ['database_id'],
    options: async ({ auth, database_id }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your Notion account first',
          options: [],
        };
      }
      if (!database_id) {
        return {
          disabled: true,
          placeholder: 'Select a database first',
          options: [],
        };
      }
      const notion = new Client({
        auth: getNotionToken(auth as NotionAuthValue),
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
    auth: notionAuth,
    displayName: 'Archived Item',
    description: 'Archived items in the selected database.',
    required: true,
    refreshers: ['database_id'],
    options: async ({ auth, database_id }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your Notion account first',
          options: [],
        };
      }
      if (!database_id) {
        return {
          disabled: true,
          placeholder: 'Select a database first',
          options: [],
        };
      }

      try {
        const notion = new Client({
          auth: getNotionToken(auth as NotionAuthValue),
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
            placeholder: 'No archived items in this database',
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
          placeholder: 'Could not load items. Check the integration has access.',
          options: [],
        };
      }
    },
  }),
  databaseFields: Property.DynamicProperties({
    auth: notionAuth,
    displayName: 'Fields',
    required: true,
    refreshers: ['database_id'],
    props: async ({ auth, database_id }) => {
      if (!auth || !database_id) {
        return {};
      }
      const fields: DynamicPropsValue = {};
      try {
        const notion = new Client({
          auth: getNotionToken(auth as NotionAuthValue),
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
    auth: notionAuth,
    displayName: 'Fields',
    required: true,
    refreshers: ['database_id'],
    props: async ({ auth, database_id }) => {
      if (!auth || !database_id) {
        return {};
      }
      const fields: DynamicPropsValue = {};
      try {
        const notion = new Client({
          auth: getNotionToken(auth as NotionAuthValue),
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
              fields[property.name] = Property.StaticDropdown({
                displayName: property.name,
                required: false,
                options: {
                  disabled: false,
                  options: results
                    .filter(
                      (user) => user.type === 'person' && user.name !== null
                    )
                    .map((option) => ({
                      label: option.name as string,
                      value: option.id,
                    })),
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
              'Notion: could not generate dynamic filter property',
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

  page: Property.Dropdown({
    auth: notionAuth,
    displayName: 'Page',
    required: true,
    description:
      'Your 100 most recently edited pages shared with the integration.',
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your Notion account first',
          options: [],
        };
      }
      const pages = await getPages(auth as NotionAuthValue);

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
  auth: NotionAuthValue,
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
    auth: getNotionToken(auth),
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
