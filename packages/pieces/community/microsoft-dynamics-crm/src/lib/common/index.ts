import {
  DropdownState,
  DynamicPropsValue,
  Property,
} from '@activepieces/pieces-framework';
import { dynamicsCRMAuth } from '../auth';
import { DynamicsCRMClient, dynamicsClientInternals, makeClient } from './client';
import { EntityAttributeType } from './constants';
import { odata } from './odata';
import { outputKeys } from './output-schemas';
import { DynamicsAuthValue, EntityAttribute, EntityDefinition } from './types';

const DROPDOWN_PAGE_SIZE = 100;
const DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T/;

const FIELD_TYPES_EXCLUDED: string[] = [
  EntityAttributeType.ENTITY_NAME,
  EntityAttributeType.LOOKUP,
  EntityAttributeType.CUSTOMER,
  EntityAttributeType.OWNER,
  EntityAttributeType.PARTY_LIST,
  EntityAttributeType.VIRTUAL,
  EntityAttributeType.UNIQUE_IDENTIFIER,
];

function errorText(error: unknown): string {
  return error instanceof Error ? error.message.slice(0, 200) : 'Could not load options.';
}

function failedDropdown<T>(error: unknown): DropdownState<T> {
  return { disabled: true, options: [], placeholder: errorText(error) };
}

async function entitySetOptions(auth: DynamicsAuthValue): Promise<DropdownState<string>> {
  return filteredEntitySetOptions({ auth, include: () => true });
}

async function filteredEntitySetOptions({ auth, include }: FilteredEntitySetParams): Promise<DropdownState<string>> {
  try {
    const entities = await makeClient(auth).listEntities();
    return { disabled: false, options: tableOptions({ entities, include }) };
  } catch (error) {
    return failedDropdown(error);
  }
}

function tableOptions({ entities, include }: TableOptionsParams): TableOption[] {
  const options = entities.filter(include).map((entity) => {
    const set = entity.EntitySetName ?? entity.LogicalName;
    const display = dynamicsClientInternals.labelText(entity.DisplayName);
    return {
      label: display ? `${display} (${set})` : set,
      value: set,
    };
  });
  return sortTableOptions(options);
}

function tableDropdown<R extends boolean>({ displayName, description, required, include }: TableDropdownParams<R>) {
  return Property.Dropdown<string, R, typeof dynamicsCRMAuth>({
    auth: dynamicsCRMAuth,
    displayName,
    description,
    required,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: 'Connect your account first.' };
      }
      return filteredEntitySetOptions({ auth, include });
    },
  });
}

function orderFieldAttributes(attributes: EntityAttribute[]): EntityAttribute[] {
  const labelled = attributes.map((attribute) => ({
    attribute,
    label: dynamicsClientInternals.labelText(attribute.DisplayName) ?? attribute.LogicalName,
    value: attribute.LogicalName,
  }));
  const primary = labelled.filter((item) => item.attribute.IsPrimaryName);
  const required = labelled.filter((item) => !item.attribute.IsPrimaryName && isRequiredLevel(item.attribute));
  const rest = labelled.filter((item) => !item.attribute.IsPrimaryName && !isRequiredLevel(item.attribute));
  return [...primary, ...sortDeprecatedLast(required), ...sortDeprecatedLast(rest)].map((item) => item.attribute);
}

function isRequiredLevel(attribute: EntityAttribute): boolean {
  const level = attribute.RequiredLevel?.Value;
  return level === 'ApplicationRequired' || level === 'SystemRequired';
}

function sortTableOptions(options: TableOption[]): TableOption[] {
  const pinned = PINNED_TABLES.flatMap((value) => options.filter((option) => option.value === value));
  const rest = options.filter((option) => !PINNED_TABLES.includes(option.value));
  return [...pinned, ...sortDeprecatedLast(rest)];
}

function sortDeprecatedLast<T extends TableOption>(options: T[]): T[] {
  const rank = (option: T): number => (DEPRECATED_LABEL.test(option.label) ? 1 : 0);
  const sortName = (option: T): string => option.label.replace(DEPRECATED_LABEL, ' ').replace(/\s+/g, ' ').trim();
  return [...options].sort(
    (a, b) => rank(a) - rank(b) || sortName(a).localeCompare(sortName(b), undefined, { sensitivity: 'base' }),
  );
}

const PINNED_TABLES = ['accounts', 'contacts', 'leads', 'opportunities'];
const DEPRECATED_LABEL = /\s*[([]deprecated[)\]]\s*/i;

async function recordOptions({ client, entitySet, searchValue }: RecordOptionsParams): Promise<DropdownState<string>> {
  try {
    const entity = await client.getEntityBySetName(entitySet);
    const nameColumn = entity.PrimaryNameAttribute;
    const search = typeof searchValue === 'string' ? searchValue.trim() : '';
    const page = await client.listRecords({
      entitySet,
      pageSize: DROPDOWN_PAGE_SIZE,
      select: nameColumn ? [entity.PrimaryIdAttribute, nameColumn] : [entity.PrimaryIdAttribute],
      orderby: nameColumn ? `${nameColumn} asc` : undefined,
      filter: nameColumn && search !== '' ? `contains(${nameColumn},'${odata.escapeContains(search)}')` : undefined,
    });
    const options = page.records
      .map((record) => {
        const id = record[entity.PrimaryIdAttribute];
        const name = nameColumn ? record[nameColumn] : undefined;
        if (typeof id !== 'string') {
          return undefined;
        }
        return { label: typeof name === 'string' && name !== '' ? name : id, value: id };
      })
      .filter((option): option is { label: string; value: string } => option !== undefined);
    return {
      disabled: false,
      options,
      placeholder: recordPlaceholder({ hasMore: page.hasMore, isEmpty: options.length === 0 && search === '' }),
    };
  } catch (error) {
    return failedDropdown(error);
  }
}

function recordPlaceholder({ hasMore, isEmpty }: { hasMore: boolean; isEmpty: boolean }): string | undefined {
  if (isEmpty) return 'No records yet. Map an ID instead.';
  return hasMore ? 'Showing the first 100 records. Type to search by name.' : undefined;
}

async function buildEntityFields({ auth, entitySet, isCreate }: EntityFieldsParams): Promise<DynamicPropsValue> {
  const fields: DynamicPropsValue = {};
  const client = makeClient(auth);
  const entity = await client.getEntityBySetName(entitySet);
  const attributes = await client.listAttributes(entity.LogicalName);
  for (const field of orderFieldAttributes(attributes)) {
    const valid = isCreate ? field.IsValidForCreate : field.IsValidForUpdate;
    if (!valid || field.AttributeOf || FIELD_TYPES_EXCLUDED.includes(field.AttributeType)) {
      continue;
    }
    const params = {
      displayName: dynamicsClientInternals.labelText(field.DisplayName) ?? field.LogicalName,
      description: dynamicsClientInternals.labelText(field.Description) ?? '',
      required: Boolean(field.IsPrimaryName) && isCreate,
    };
    switch (field.AttributeType) {
      case EntityAttributeType.BIGINT:
      case EntityAttributeType.DECIMAL:
      case EntityAttributeType.DOUBLE:
      case EntityAttributeType.INTEGER:
      case EntityAttributeType.MONEY:
        fields[field.LogicalName] = Property.Number(params);
        break;
      case EntityAttributeType.DATETIME:
        fields[field.LogicalName] = Property.DateTime(params);
        break;
      case EntityAttributeType.BOOLEAN:
        fields[field.LogicalName] = Property.Checkbox(params);
        break;
      case EntityAttributeType.STRING:
        fields[field.LogicalName] = Property.ShortText(params);
        break;
      case EntityAttributeType.MEMO:
        fields[field.LogicalName] = Property.LongText(params);
        break;
      case EntityAttributeType.PICKLIST:
      case EntityAttributeType.STATE:
      case EntityAttributeType.STATUS: {
        const options = await client.fetchOptionFieldValues({
          logicalName: entity.LogicalName,
          attribute: field.LogicalName,
          attributeType: field.AttributeType,
        });
        fields[field.LogicalName] = Property.StaticDropdown({
          ...params,
          options: { disabled: false, options },
        });
        break;
      }
      default:
        break;
    }
  }
  return fields;
}

function buildRecordBody({ fields, additionalFields }: { fields: unknown; additionalFields: unknown }): Record<string, unknown> {
  const extra = odata.parseJsonObject({ value: additionalFields, label: 'Additional Fields' });
  const dynamic = odata.isRecord(fields) ? odata.compactFields(fields) : {};
  return { ...extra, ...dynamic };
}

async function normalizeDateOnlyFields({ client, entitySet, body }: { client: DynamicsCRMClient; entitySet: string; body: Record<string, unknown> }): Promise<Record<string, unknown>> {
  const candidates = Object.entries(body).filter(([, value]) => typeof value === 'string' && DATE_TIME_PATTERN.test(value));
  if (candidates.length === 0) {
    return body;
  }
  const entity = await client.getEntityBySetName(entitySet);
  const dateOnly = new Set(await client.listDateOnlyColumns(entity.LogicalName));
  return Object.fromEntries(
    Object.entries(body).map(([key, value]) =>
      dateOnly.has(key) && typeof value === 'string' && DATE_TIME_PATTERN.test(value) ? [key, value.slice(0, 10)] : [key, value]
    )
  );
}

async function shapeGenericRecord({ client, entitySet, record }: ShapeGenericParams): Promise<Record<string, unknown>> {
  const entity = await client.getEntityBySetName(entitySet);
  return odata.shapeRecord({ record, keys: outputKeys.record, primaryId: entity.PrimaryIdAttribute, entitySet });
}

type ShapeGenericParams = {
  client: DynamicsCRMClient;
  entitySet: string;
  record: Record<string, unknown>;
};

type FilteredEntitySetParams = {
  auth: DynamicsAuthValue;
  include: (entity: EntityDefinition) => boolean;
};

type TableOptionsParams = {
  entities: EntityDefinition[];
  include: (entity: EntityDefinition) => boolean;
};

type TableDropdownParams<R extends boolean> = {
  displayName: string;
  description: string;
  required: R;
  include: (entity: EntityDefinition) => boolean;
};

type TableOption = {
  label: string;
  value: string;
};

type RecordOptionsParams = {
  client: DynamicsCRMClient;
  entitySet: string;
  searchValue?: string;
};

type EntityFieldsParams = {
  auth: DynamicsAuthValue;
  entitySet: string;
  isCreate: boolean;
};

export const DynamicsCRMCommon = {
  entityType: (description: string) =>
    Property.Dropdown({
      auth: dynamicsCRMAuth,
      displayName: 'Table',
      refreshers: [],
      description,
      required: true,
      options: async ({ auth }) => {
        if (!auth) {
          return { disabled: true, options: [], placeholder: 'Connect your account first.' };
        }
        return entitySetOptions(auth);
      },
    }),
  recordId: Property.Dropdown({
    auth: dynamicsCRMAuth,
    displayName: 'Record ID',
    description: 'Pick a record, type to search by its name, or map a record ID (GUID).',
    refreshers: ['entityType'],
    refreshOnSearch: true,
    required: true,
    options: async ({ auth, entityType }, { searchValue }) => {
      if (!auth || typeof entityType !== 'string' || entityType === '') {
        return { disabled: true, options: [], placeholder: 'Select a table first.' };
      }
      return recordOptions({ client: makeClient(auth), entitySet: entityType, searchValue });
    },
  }),
  entityFields: (isCreate = true) =>
    Property.DynamicProperties({
      auth: dynamicsCRMAuth,
      displayName: 'Fields',
      refreshers: ['auth', 'entityType'],
      required: true,
      props: async ({ auth, entityType }) => {
        if (!auth || typeof entityType !== 'string' || entityType === '') {
          return {};
        }
        return buildEntityFields({ auth, entitySet: entityType, isCreate });
      },
    }),
  additionalFields: Property.Json({
    displayName: 'Additional Fields',
    description:
      'Optional raw Web API fields as JSON, for example lookups: {"parentcustomerid_account@odata.bind": "/accounts(<id>)"}. Fields above win.',
    required: false,
  }),
};

export const dynamicsCommonInternals = {
  entitySetOptions,
  tableOptions,
  tableDropdown,
  orderFieldAttributes,
  sortTableOptions,
  recordPlaceholder,
  sortDeprecatedLast,
  recordOptions,
  buildRecordBody,
  failedDropdown,
  shapeGenericRecord,
  normalizeDateOnlyFields,
};

export { makeClient };
