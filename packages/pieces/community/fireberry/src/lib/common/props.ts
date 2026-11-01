import { DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { FireberryClient, FireberryFieldMetadata, FireberryPicklistValue, fireberryUtils } from './client';
import { fireberryFieldTypes } from './field-types';
import { fireberryAuth } from '../auth';

const SYSTEM_FIELDS = ['createdby', 'modifiedby', 'deletedby', 'createdon', 'modifiedon', 'deletedon'];
const LARGE_PICKLISTS = ['objecttypecode', 'resultcode'];
const MAX_DROPDOWN_OPTIONS = 20;

function objectTypeValue(objectType: unknown): string | undefined {
  if (typeof objectType === 'string' && objectType.length > 0) {
    return objectType;
  }
  if (fireberryUtils.isRecord(objectType) && typeof objectType['value'] === 'string') {
    return objectType['value'];
  }
  return undefined;
}

function recordLabel({ record, primaryField, primaryKey }: { record: Record<string, unknown>; primaryField: string; primaryKey: string }): string {
  for (const key of [primaryField, 'name', 'title', 'subject', 'accountname', 'fullname', 'firstname', 'emailaddress1']) {
    const value = record[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }
  return `Record ${String(record[primaryKey] ?? '')}`;
}

async function recordOptions({ token, objectType, top }: { token: string; objectType: unknown; top: number }) {
  const objectSystemName = objectTypeValue(objectType);
  if (!objectSystemName) {
    return { disabled: true, options: [], placeholder: 'Select object type first' };
  }
  const list = await new FireberryClient(token).listRecords({ objectSystemName, top });
  const options = list.Records.map((record) => ({
    label: recordLabel({ record, primaryField: list.PrimaryField, primaryKey: list.PrimaryKey }),
    value: String(record[list.PrimaryKey] ?? ''),
  })).filter((option) => option.value.length > 0);
  return {
    disabled: false,
    options,
    placeholder: options.length === 0 ? 'No records found' : undefined,
  };
}

function lookupDescription({ fieldName, suffix }: { fieldName: string; suffix: string }): string {
  const name = fieldName.toLowerCase();
  if (name.includes('account')) return `Account record ID${suffix}`;
  if (name.includes('contact')) return `Contact record ID${suffix}`;
  if (name.includes('owner')) return `User record ID for owner${suffix}`;
  if (name.includes('product')) return `Product record ID${suffix}`;
  if (name.includes('user')) return `User record ID${suffix}`;
  return `Record ID (GUID)${suffix}`;
}

function buildFieldProp({ field, picklistValues, forUpdate }: { field: FireberryFieldMetadata; picklistValues: FireberryPicklistValue[] | undefined; forUpdate: boolean }) {
  const displayName = field.label || field.fieldName;
  const suffix = forUpdate ? ' (leave empty to keep current value)' : '';
  const keepCurrent = forUpdate ? 'Leave empty to keep current value' : undefined;
  switch (fireberryFieldTypes.fieldTypeFromId(field.systemFieldTypeId)) {
    case 'number':
      return Property.Number({ displayName, required: false, description: keepCurrent });
    case 'datetime':
    case 'date':
      return Property.DateTime({ displayName, required: false, description: forUpdate ? keepCurrent : 'Date and time in UTC format' });
    case 'longtext':
    case 'html':
      return Property.LongText({ displayName, required: false, description: keepCurrent });
    case 'lookup':
      return Property.ShortText({ displayName, required: false, description: lookupDescription({ fieldName: field.fieldName, suffix }) });
    case 'picklist': {
      if (picklistValues && picklistValues.length > 0 && picklistValues.length <= MAX_DROPDOWN_OPTIONS) {
        const options = picklistValues.map((option) => ({ label: option.name || option.value, value: option.value }));
        return Property.StaticDropdown({
          displayName,
          required: false,
          description: keepCurrent,
          options: { disabled: false, options },
        });
      }
      return Property.ShortText({
        displayName,
        required: false,
        description: picklistValues && picklistValues.length > MAX_DROPDOWN_OPTIONS
          ? `Enter numeric value (${picklistValues.length} options available)${suffix}`
          : `Enter the numeric value for this field${suffix}`,
      });
    }
    default:
      return Property.ShortText({ displayName, required: false, description: keepCurrent });
  }
}

async function buildRecordFieldProps({ token, objectType, forUpdate }: { token: string; objectType: unknown; forUpdate: boolean }) {
  const objectSystemName = objectTypeValue(objectType);
  const props: DynamicPropsValue = {};
  if (!objectSystemName) {
    return props;
  }
  const client = new FireberryClient(token);
  const fields = (await client.getObjectFieldsMetadata(objectSystemName)).filter(
    (field) => !(field.fieldName.endsWith('id') && !field.label) && !SYSTEM_FIELDS.includes(field.fieldName.toLowerCase()),
  );
  const picklistFields = fields.filter(
    (field) => fireberryFieldTypes.fieldTypeFromId(field.systemFieldTypeId) === 'picklist' && !LARGE_PICKLISTS.includes(field.fieldName.toLowerCase()),
  );
  const picklistEntries = await Promise.all(
    picklistFields.map(async (field) => {
      const values = await client.getPicklistValues({ objectSystemName, fieldName: field.fieldName });
      return [field.fieldName, values] satisfies [string, FireberryPicklistValue[]];
    }),
  );
  const picklists = new Map<string, FireberryPicklistValue[]>(picklistEntries);
  for (const field of fields) {
    props[field.fieldName] = buildFieldProp({ field, picklistValues: picklists.get(field.fieldName), forUpdate });
  }
  return props;
}

export const objectTypeDropdown = Property.Dropdown({
  displayName: 'Object Type',
  required: true,
  refreshers: [],
  auth: fireberryAuth,
  options: async ({ auth }) => {
    if (!auth) {
      return { disabled: true, options: [], placeholder: 'Connect your Fireberry account' };
    }
    const objects = await new FireberryClient(auth.secret_text).getObjectsMetadata();
    return {
      disabled: false,
      options: objects.map((obj) => ({ label: obj.name, value: obj.systemName })),
    };
  },
});

export const objectFields = Property.DynamicProperties({
  displayName: 'Fields',
  refreshers: ['objectType'],
  required: true,
  auth: fireberryAuth,
  props: async ({ auth, objectType }) => {
    if (!auth) return {};
    return buildRecordFieldProps({ token: auth.secret_text, objectType, forUpdate: false });
  },
});

export const updateFields = Property.DynamicProperties({
  displayName: 'Fields to Update',
  refreshers: ['objectType'],
  required: true,
  auth: fireberryAuth,
  props: async ({ auth, objectType }) => {
    if (!auth) return {};
    return buildRecordFieldProps({ token: auth.secret_text, objectType, forUpdate: true });
  },
});

export const fireberryProps = {
  objectTypeValue,
  recordOptions,
};
