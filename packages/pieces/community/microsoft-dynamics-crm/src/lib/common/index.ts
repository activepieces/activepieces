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
import { DynamicsAuthValue } from './types';

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
  try {
    const entities = await makeClient(auth).listEntities();
    return {
      disabled: false,
      options: entities.map((entity) => {
        const set = entity.EntitySetName ?? entity.LogicalName;
        const display = dynamicsClientInternals.labelText(entity.DisplayName);
        return {
          label: display ? `${display} (${set})` : set,
          value: set,
        };
      }),
    };
  } catch (error) {
    return failedDropdown(error);
  }
}

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
      placeholder: page.hasMore ? 'Showing the first 100 records. Type to search by name.' : undefined,
    };
  } catch (error) {
    return failedDropdown(error);
  }
}

async function buildEntityFields({ auth, entitySet, isCreate }: EntityFieldsParams): Promise<DynamicPropsValue> {
  const fields: DynamicPropsValue = {};
  const client = makeClient(auth);
  const entity = await client.getEntityBySetName(entitySet);
  const attributes = await client.listAttributes(entity.LogicalName);
  for (const field of attributes) {
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
      displayName: 'Entity Type',
      refreshers: [],
      description,
      required: true,
      options: async ({ auth }) => {
        if (!auth) {
          return { disabled: true, options: [], placeholder: 'Please connect your account first.' };
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
        return { disabled: true, options: [], placeholder: 'Please select entity type first.' };
      }
      return recordOptions({ client: makeClient(auth), entitySet: entityType, searchValue });
    },
  }),
  entityFields: (isCreate = true) =>
    Property.DynamicProperties({
      auth: dynamicsCRMAuth,
      displayName: 'Entity Fields',
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
      'Optional raw Web API fields, for example lookups such as {"parentcustomerid_account@odata.bind": "/accounts(<id>)"}. Fields picked above win over the same key here.',
    required: false,
  }),
};

export const dynamicsCommonInternals = {
  entitySetOptions,
  recordOptions,
  buildRecordBody,
  failedDropdown,
  shapeGenericRecord,
  normalizeDateOnlyFields,
};

export { makeClient };
