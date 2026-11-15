import { DropdownOption, Property } from '@activepieces/pieces-framework';
import { cmsAuth } from '../auth';
import { totalcmsApi, totalcmsHelpers, TotalCmsConnection } from './client';

const OBJECT_PAGE_SIZE = 100;
const OBJECT_DROPDOWN_MAX = 2000;
const LABEL_KEYS = ['title', 'name', 'label', 'email'];

export const totalcmsProps = {
  collection,
  object,
  objectIdText,
  collectionIdText,
  collectionForSchema,
  schemaField,
};

function collection({
  displayName = 'Collection',
  description = 'The Total CMS collection to use.',
  schemas,
}: {
  displayName?: string;
  description?: string;
  schemas?: string[];
} = {}) {
  return Property.Dropdown({
    auth: cmsAuth,
    displayName,
    description,
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return { disabled: true, placeholder: 'Connect your Total CMS site first.', options: [] };
      }
      try {
        const collections = await totalcmsApi.listCollections({ auth });
        const matching = schemas ? collections.filter((item) => schemas.includes(item.schema)) : collections;
        if (matching.length === 0) {
          return {
            disabled: true,
            placeholder: schemas
              ? `No collection uses the ${schemas.join(' or ')} schema. Create one in Total CMS first.`
              : 'This site has no collections yet.',
            options: [],
          };
        }
        return {
          disabled: false,
          options: matching.map((item) => ({
            label: item.name && item.name !== item.id ? `${item.name} (${item.id})` : item.id,
            value: item.id,
          })),
        };
      } catch (error) {
        return { disabled: true, placeholder: errorPlaceholder({ error, what: 'collections' }), options: [] };
      }
    },
  });
}

function object({
  displayName = 'Object',
  description = 'The object to use. The list shows each object by title and ID.',
}: {
  displayName?: string;
  description?: string;
} = {}) {
  return Property.Dropdown({
    auth: cmsAuth,
    displayName,
    description,
    required: true,
    refreshers: ['collection'],
    options: async ({ auth, collection }) => {
      if (!auth) {
        return { disabled: true, placeholder: 'Connect your Total CMS site first.', options: [] };
      }
      if (typeof collection !== 'string' || collection.length === 0) {
        return { disabled: true, placeholder: 'Select a collection first.', options: [] };
      }
      try {
        const { options, truncated } = await objectOptions({ auth, collection });
        if (options.length === 0) {
          return { disabled: true, placeholder: 'This collection has no objects yet.', options: [] };
        }
        return {
          disabled: false,
          placeholder: truncated ? `Showing the first ${OBJECT_DROPDOWN_MAX} objects. Use an expression with the ID for others.` : undefined,
          options,
        };
      } catch (error) {
        return { disabled: true, placeholder: errorPlaceholder({ error, what: 'objects' }), options: [] };
      }
    },
  });
}

function schemaField({
  displayName,
  description,
  fieldTypes,
  numeric,
}: {
  displayName: string;
  description: string;
  fieldTypes?: string[];
  numeric?: boolean;
}) {
  return Property.Dropdown({
    auth: cmsAuth,
    displayName,
    description,
    required: true,
    refreshers: ['collection'],
    options: async ({ auth, collection }) => {
      if (!auth) {
        return { disabled: true, placeholder: 'Connect your Total CMS site first.', options: [] };
      }
      if (typeof collection !== 'string' || collection.length === 0) {
        return { disabled: true, placeholder: 'Select a collection first.', options: [] };
      }
      try {
        const schema = await totalcmsApi.getSchema({ auth, collection });
        const properties = totalcmsHelpers.isRecord(schema['properties']) ? schema['properties'] : {};
        const options = Object.entries(properties).flatMap(([key, value]): DropdownOption<string>[] => {
          if (!totalcmsHelpers.isRecord(value)) {
            return [];
          }
          const field = typeof value['field'] === 'string' ? value['field'] : '';
          const type = typeof value['type'] === 'string' ? value['type'] : '';
          const matches = numeric
            ? type === 'number' || type === 'integer'
            : fieldTypes !== undefined && fieldTypes.includes(field);
          if (!matches) {
            return [];
          }
          const label = typeof value['label'] === 'string' && value['label'].length > 0 ? value['label'] : key;
          return [{ label: `${label} (${key})`, value: key }];
        });
        if (options.length === 0) {
          return {
            disabled: true,
            placeholder: numeric ? 'This collection has no number fields.' : 'This collection has no file or image fields.',
            options: [],
          };
        }
        return { disabled: false, options };
      } catch (error) {
        return { disabled: true, placeholder: errorPlaceholder({ error, what: 'fields' }), options: [] };
      }
    },
  });
}

function collectionIdText() {
  return Property.ShortText({
    displayName: 'Collection ID',
    description: 'The collection ID, for example blog. Get it from List Collections.',
    required: true,
  });
}

function collectionForSchema({ schema, label }: { schema: string; label: string }) {
  return Property.ShortText({
    displayName: 'Collection ID',
    description: `The ID of a collection that uses the ${label} schema. The built-in ${label} collection is called ${schema}. Find other IDs with List Collections.`,
    required: true,
    defaultValue: schema,
  });
}

function objectIdText({
  displayName = 'Object ID',
  description = 'The object ID (its URL slug). Get it from Find Objects (by Collection ID).',
  required = true,
}: {
  displayName?: string;
  description?: string;
  required?: boolean;
} = {}) {
  return Property.ShortText({ displayName, description, required });
}

async function objectOptions({
  auth,
  collection,
}: {
  auth: TotalCmsConnection;
  collection: string;
}): Promise<{ options: DropdownOption<string>[]; truncated: boolean }> {
  const pages: DropdownOption<string>[][] = [];
  let offset = 0;
  let total = Infinity;
  while (offset < total && offset < OBJECT_DROPDOWN_MAX) {
    const page = await totalcmsApi.queryObjects({ auth, collection, limit: OBJECT_PAGE_SIZE, offset });
    total = page.total;
    pages.push(page.objects.map((item) => ({ label: objectLabel(item), value: String(item['id'] ?? '') })));
    if (page.objects.length < OBJECT_PAGE_SIZE) {
      break;
    }
    offset += OBJECT_PAGE_SIZE;
  }
  const options = pages.flat().filter((option) => option.value.length > 0);
  return { options, truncated: total > options.length };
}

function objectLabel(item: Record<string, unknown>): string {
  const id = String(item['id'] ?? '');
  const labelKey = LABEL_KEYS.find((key) => typeof item[key] === 'string' && String(item[key]).trim().length > 0);
  return labelKey ? `${String(item[labelKey]).trim()} (${id})` : id;
}

function errorPlaceholder({ error, what }: { error: unknown; what: string }): string {
  const status = totalcmsHelpers.statusOf(error);
  if (status === 401 || status === 403) {
    return `Total CMS refused to list ${what}. Check the API key and its allowed endpoints.`;
  }
  if (status === 404) {
    return `Could not find ${what}. Check the collection still exists.`;
  }
  return `Could not load ${what}. Check the connection and that the site is online.`;
}
