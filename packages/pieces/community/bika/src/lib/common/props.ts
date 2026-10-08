import { DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { BikaAuth } from '../auth';
import { bikaClient, BikaField, bikaParse } from './client';
import { BIKA_READ_ONLY_FIELD_TYPES, BikaFieldType } from './constants';

export const bikaProps = {
  space: spaceDropdown,
  database: databaseDropdown,
  fields: fieldsDynamic,
  recordId,
  spaceIdText,
  databaseIdText,
  recordIdText,
};

function spaceDropdown() {
  return Property.Dropdown({
    auth: BikaAuth,
    displayName: 'Space',
    description: 'The Bika space that holds the database.',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: 'Connect your Bika account first.' };
      }
      try {
        const response = await bikaClient.listSpaces({ token: auth.props.token });
        const spaces = bikaParse.toSpaces(response.data).filter((space) => space.id.length > 0);
        if (spaces.length === 0) {
          return { disabled: true, options: [], placeholder: 'This Bika account has no spaces.' };
        }
        return { disabled: false, options: spaces.map((space) => ({ label: space.name, value: space.id })) };
      } catch (error) {
        return { disabled: true, options: [], placeholder: errorPlaceholder({ error, what: 'spaces' }) };
      }
    },
  });
}

function databaseDropdown() {
  return Property.Dropdown({
    auth: BikaAuth,
    displayName: 'Database',
    description: 'The database (table) to work with.',
    required: true,
    refreshers: ['space_id'],
    options: async ({ auth, space_id }) => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: 'Connect your Bika account first.' };
      }
      if (typeof space_id !== 'string' || space_id.length === 0) {
        return { disabled: true, options: [], placeholder: 'Select a space first.' };
      }
      try {
        const databases = await bikaClient.listDatabases({ token: auth.props.token, spaceId: space_id });
        if (databases.length === 0) {
          return { disabled: true, options: [], placeholder: 'This space has no databases yet. Create one in Bika first.' };
        }
        return {
          disabled: false,
          options: databases.map((database) => ({ label: databaseLabel(database), value: database.id })),
        };
      } catch (error) {
        return { disabled: true, options: [], placeholder: errorPlaceholder({ error, what: 'databases' }) };
      }
    },
  });
}

function fieldsDynamic({ description }: { description: string }) {
  return Property.DynamicProperties({
    auth: BikaAuth,
    displayName: 'Fields',
    description,
    required: true,
    refreshers: ['auth', 'space_id', 'database_id'],
    props: async ({ auth, space_id, database_id }) => {
      if (!auth || typeof space_id !== 'string' || typeof database_id !== 'string' || space_id.length === 0 || database_id.length === 0) {
        return {};
      }
      try {
        const response = await bikaClient.getFields({ token: auth.props.token, spaceId: space_id, databaseId: database_id });
        return Object.fromEntries(
          bikaParse.toFields(response.data)
            .filter((field) => !BIKA_READ_ONLY_FIELD_TYPES.includes(field.type))
            .map((field) => [field.name, fieldProperty(field)])
            .filter((entry): entry is [string, NonNullable<ReturnType<typeof fieldProperty>>] => entry[1] !== null),
        );
      } catch (error) {
        const props: DynamicPropsValue = {
          load_error: Property.MarkDown({ value: `Could not load the database fields: ${error instanceof Error ? error.message : String(error)}` }),
        };
        return props;
      }
    },
  });
}

function recordId({ description }: { description: string }) {
  return Property.ShortText({ displayName: 'Record ID', description, required: true });
}

function spaceIdText() {
  return Property.ShortText({
    displayName: 'Space ID',
    description: 'The space ID (starts with "spc"). Use List Spaces to find it.',
    required: true,
  });
}

function databaseIdText() {
  return Property.ShortText({
    displayName: 'Database ID',
    description: 'The database ID (starts with "dat"). Use List Databases to find it.',
    required: true,
  });
}

function recordIdText({ description }: { description: string }) {
  return Property.ShortText({ displayName: 'Record ID', description, required: true });
}

function fieldProperty(field: BikaField) {
  const base = { displayName: field.name, description: field.description || undefined, required: false };
  switch (field.type) {
    case BikaFieldType.SINGLE_TEXT:
    case BikaFieldType.URL:
    case BikaFieldType.EMAIL:
    case BikaFieldType.PHONE:
      return Property.ShortText(base);
    case BikaFieldType.LONG_TEXT:
      return Property.LongText(base);
    case BikaFieldType.NUMBER:
    case BikaFieldType.CURRENCY:
    case BikaFieldType.PERCENT:
    case BikaFieldType.RATING:
      return Property.Number(base);
    case BikaFieldType.CHECKBOX:
      return Property.Checkbox(base);
    case BikaFieldType.DATETIME:
      return Property.DateTime(base);
    case BikaFieldType.DATERANGE:
      return Property.ShortText({
        ...base,
        description: 'Start and end as two ISO dates joined by "/", for example 2026-01-01T09:00:00Z/2026-01-05T17:00:00Z.',
      });
    case BikaFieldType.SINGLE_SELECT:
      return Property.StaticDropdown({
        ...base,
        options: { options: field.options.map((option) => ({ label: option.name, value: option.name })) },
      });
    case BikaFieldType.MULTI_SELECT:
      return Property.StaticMultiSelectDropdown({
        ...base,
        options: { options: field.options.map((option) => ({ label: option.name, value: option.name })) },
      });
    case BikaFieldType.MEMBER:
      return Property.Array({
        ...base,
        description: 'Member, team or role IDs. Map them from the member field of a Get Record or Find Records step.',
      });
    case BikaFieldType.LINK:
    case BikaFieldType.ONE_WAY_LINK:
      return Property.Array({
        ...base,
        description: 'Record IDs from the linked database (they start with "rec").',
      });
    case BikaFieldType.ATTACHMENT:
      return Property.File({
        ...base,
        description: 'A file to upload to Bika and attach to this field.',
      });
    default:
      return null;
  }
}

function databaseLabel(database: { name: string; path?: string }): string {
  const folder = (database.path ?? '').replace(/^\/ROOT\/?/, '');
  return folder.length > 0 ? `${database.name} (${folder})` : database.name;
}

function errorPlaceholder({ error, what }: { error: unknown; what: string }): string {
  const message = error instanceof Error ? error.message : String(error);
  return `Could not load ${what}: ${message}`.slice(0, 300);
}
