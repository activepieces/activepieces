import { HttpMethod } from '@activepieces/pieces-common';
import {
  AppConnectionValueForAuthProperty,
  DropdownState,
  DynamicPropsValue,
  Property,
} from '@activepieces/pieces-framework';
import { vtigerAuth } from './auth';
import { isRecord, vtigerRest, VtigerCredentials } from './rest-client';
import { assertModuleName } from './vtql';
import { restOrVtws, vtwsCall, vtwsLogin, vtwsQuery, VtwsSession } from './vtws';

export function propText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function moduleLabeler({
  creds,
  module,
}: {
  creds: VtigerCredentials;
  module: string;
}): (record: Record<string, unknown>) => Promise<string> {
  const fixed = STATIC_LABELS[module];
  if (fixed) {
    return async (record) => fixed(record);
  }
  let labelField: Promise<string> | undefined;
  return async (record) => {
    labelField ??= describeLabelField({ creds, module });
    const field = await labelField;
    return field === '' ? '' : textOf(record[field]);
  };
}

export async function listModuleNames(creds: VtigerCredentials): Promise<string[]> {
  const result = await restOrVtws<{ types?: unknown }>({
    rest: () =>
      vtigerRest<{ types?: unknown }>({
        creds,
        method: HttpMethod.GET,
        path: 'listtypes',
        query: { fieldTypeList: 'null' },
      }),
    vtws: async () => {
      const session = await vtwsLogin(creds);
      return (await vtwsCall<{ types?: unknown }>({ creds, session, operation: 'listtypes', params: {} })).result;
    },
  });
  const types = Array.isArray(result.types)
    ? result.types.filter((t): t is string => typeof t === 'string')
    : [];
  const names = new Set([...Object.keys(STATIC_LABELS), ...types]);
  return [...names].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
}

export const elementTypeProperty = Property.Dropdown({
  auth: vtigerAuth,
  displayName: 'Module Type',
  description: 'The module / element type',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please setup authentication to continue',
      };
    }
    try {
      const modules = await listModuleNames(auth.props);
      return {
        disabled: false,
        options: modules.map((module) => ({ label: module, value: module })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: `Could not load modules: ${errorText(error)}`,
      };
    }
  },
});

export const recordIdProperty = () =>
  Property.DynamicProperties({
    auth: vtigerAuth,
    displayName: 'Record Fields',
    description: 'Add new fields to be created in the new record',
    required: true,
    refreshers: ['elementType'],
    props: async ({ auth, elementType }) => {
      const module = propText(elementType);
      if (!auth || module === '') {
        return {};
      }
      const name = assertModuleName(module);
      const session = await vtwsLogin(auth.props);
      const records = await vtwsQuery<Record<string, unknown>>({
        creds: auth.props,
        session,
        query: `SELECT * FROM ${name} LIMIT ${DROPDOWN_RECORD_CAP};`,
      });
      const label = moduleLabeler({ creds: auth.props, module: name });
      const options = await Promise.all(
        records.map(async (r) => ({
          label: (await label(r)) || textOf(r['id']),
          value: textOf(r['id']),
        }))
      );
      const fields: DynamicPropsValue = {
        id: Property.StaticDropdown<string>({
          displayName: 'Id',
          description: `The record's id. Only the first ${DROPDOWN_RECORD_CAP} records of the module are listed; use an expression to pass another id.`,
          required: true,
          options: { options },
        }),
      };
      return fields;
    },
  });

export async function getRecordReference({
  auth,
  modules,
  session,
}: {
  auth: VTigerAuthValue;
  modules: string[];
  session?: VtwsSession;
}): Promise<DropdownState<string>> {
  const module = modules[0];
  try {
    const name = assertModuleName(module);
    const activeSession = session ?? (await vtwsLogin(auth.props));
    const records = await vtwsQuery<Record<string, unknown>>({
      creds: auth.props,
      session: activeSession,
      query: `SELECT * FROM ${name} LIMIT ${DROPDOWN_RECORD_CAP};`,
    });
    const label = moduleLabeler({ creds: auth.props, module: name });
    return {
      disabled: false,
      options: await Promise.all(
        records.map(async (record) => ({
          label: (await label(record)) || textOf(record['id']),
          value: textOf(record['id']),
        }))
      ),
    };
  } catch (error) {
    return {
      disabled: true,
      options: [],
      placeholder: `Could not load ${String(module)} records: ${errorText(error)}`,
    };
  }
}

export const recordProperty = () =>
  Property.DynamicProperties({
    auth: vtigerAuth,
    displayName: 'Record Fields',
    description: 'Add new fields to be created in the new record',
    required: true,
    refreshers: ['elementType'],
    props: async ({ auth, elementType }) => {
      const module = propText(elementType);
      if (!auth || module === '') {
        return {};
      }
      return generateElementFields({ auth, elementType: module, defaultValue: {} });
    },
  });

export async function describeFields({
  creds,
  module,
}: {
  creds: VtigerCredentials;
  module: string;
}): Promise<Field[]> {
  const elementType = assertModuleName(module);
  const result = await restOrVtws<{ fields?: Field[] }>({
    rest: () =>
      vtigerRest<{ fields?: Field[] }>({ creds, method: HttpMethod.GET, path: 'describe', query: { elementType } }),
    vtws: async () => {
      const session = await vtwsLogin(creds);
      return (await vtwsCall<{ fields?: Field[] }>({ creds, session, operation: 'describe', params: { elementType } })).result;
    },
  });
  return Array.isArray(result.fields) ? result.fields : [];
}

export function buildFieldProps({
  fields,
  elementType,
  defaultValue,
  skipMandatory,
  skipFields,
  references,
}: {
  fields: Field[];
  elementType: string;
  defaultValue: Record<string, unknown>;
  skipMandatory: boolean;
  skipFields: string[];
  references: Record<string, DropdownState<string>>;
}): DynamicPropsValue {
  const usable = fields.filter((field) => !skipFields.includes(field.name));
  const mandatory = usable.filter((field) => field.mandatory);
  const optional = usable.filter((field) => !field.mandatory);
  const selected = [...mandatory, ...optional.slice(0, Math.max(0, FIELD_PROP_CAP - mandatory.length + 1))];
  return selected.reduce<DynamicPropsValue>((acc, field) => {
    const prop = fieldProp({ field, elementType, defaultValue, skipMandatory, references });
    return prop === undefined ? acc : { ...acc, [field.name]: prop };
  }, {});
}

export const generateElementFields = async ({
  auth,
  elementType,
  defaultValue,
  skipMandatory = false,
  skipFields = ['id', 'modifiedtime', 'createdtime', 'modifiedby', 'created_user_id'],
}: {
  auth: VTigerAuthValue;
  elementType: string;
  defaultValue: Record<string, unknown>;
  skipMandatory?: boolean;
  skipFields?: string[];
}): Promise<DynamicPropsValue> => {
  const fields = await describeFields({ creds: auth.props, module: elementType });
  const references = await loadReferences({ auth, fields, skipFields });
  return buildFieldProps({ fields, elementType, defaultValue, skipMandatory, skipFields, references });
};

async function loadReferences({
  auth,
  fields,
  skipFields,
}: {
  auth: VTigerAuthValue;
  fields: Field[];
  skipFields: string[];
}): Promise<Record<string, DropdownState<string>>> {
  const wanted = fields.filter(
    (field) =>
      !skipFields.includes(field.name) &&
      (field.type.name === 'owner' || (field.type.name === 'reference' && (field.type.refersTo ?? []).length > 0))
  );
  if (wanted.length === 0) {
    return {};
  }
  const session = await vtwsLogin(auth.props);
  const references: Record<string, DropdownState<string>> = {};
  for (const field of wanted) {
    const modules = field.type.name === 'owner' ? ['Users'] : field.type.refersTo ?? [];
    references[field.name] = await getRecordReference({ auth, modules, session });
  }
  return references;
}

function fieldProp({
  field,
  elementType,
  defaultValue,
  skipMandatory,
  references,
}: {
  field: Field;
  elementType: string;
  defaultValue: Record<string, unknown>;
  skipMandatory: boolean;
  references: Record<string, DropdownState<string>>;
}) {
  const required = skipMandatory ? false : field.mandatory;
  const params = {
    displayName: field.label,
    description: `Field ${field.name} of object type ${elementType}`,
    required,
  };
  const current = defaultValue[field.name];
  const typeName = field.type.name;
  if (['mediumtext', 'url'].includes(typeName)) {
    return Property.LongText({ ...params, defaultValue: textDefault(current) });
  }
  if (['string', 'text', 'phone', 'email'].includes(typeName)) {
    return Property.ShortText({ ...params, defaultValue: textDefault(current) });
  }
  if (typeName === 'picklist') {
    return Property.StaticDropdown({
      ...params,
      defaultValue: textDefault(current),
      options: { disabled: false, options: field.type.picklistValues ?? [] },
    });
  }
  if (typeName === 'reference' || typeName === 'owner') {
    return Property.StaticDropdown({
      ...params,
      defaultValue: textDefault(current),
      options: references[field.name] ?? { disabled: false, options: [] },
    });
  }
  if (['double', 'integer', 'currency'].includes(typeName)) {
    return Property.Number({ ...params, defaultValue: numberDefault(current) });
  }
  if (typeName === 'boolean') {
    return Property.Checkbox({
      displayName: field.label,
      description: `The fields to fill in the object type ${elementType}`,
      required,
      defaultValue: current === true || current === '1' || current === 1,
    });
  }
  if (['date', 'datetime', 'time'].includes(typeName)) {
    return Property.DateTime({
      displayName: field.label,
      description: `The fields to fill in the object type ${elementType}`,
      defaultValue: textDefault(current),
      required,
    });
  }
  if (required) {
    return Property.ShortText({ ...params, defaultValue: textDefault(current) });
  }
  return undefined;
}

async function describeLabelField({
  creds,
  module,
}: {
  creds: VtigerCredentials;
  module: string;
}): Promise<string> {
  try {
    const result = await vtigerRest<{ labelFields?: unknown; fields?: Field[] }>({
      creds,
      method: HttpMethod.GET,
      path: 'describe',
      query: { elementType: assertModuleName(module) },
    });
    const lf = result.labelFields;
    const fromLabel = Array.isArray(lf)
      ? textOf(lf[0])
      : typeof lf === 'string'
      ? lf.split(',')[0]
      : '';
    if (fromLabel !== '') {
      return fromLabel;
    }
    return result.fields?.[0]?.name ?? '';
  } catch {
    return '';
  }
}

function textOf(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return '';
}

function textDefault(value: unknown): string | undefined {
  return typeof value === 'string' ? value : typeof value === 'number' ? String(value) : undefined;
}

function numberDefault(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return undefined;
}

export function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function recordFromJson({ value, label }: { value: unknown; label: string }): Record<string, unknown> {
  if (value === undefined || value === null || value === '') {
    return {};
  }
  const parsed = typeof value === 'string' ? parseJson({ text: value, label }) : value;
  if (!isRecord(parsed)) {
    throw new Error(`${label} must be a JSON object of field name to value, for example {"lastname": "Smith"}`);
  }
  return parsed;
}

function parseJson({ text, label }: { text: string; label: string }): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${label} is not valid JSON`);
  }
}

const STATIC_LABELS: Record<string, (record: Record<string, unknown>) => string> = {
  Contacts: (record) => textOf(record['email']),
  Documents: (record) => textOf(record['notes_title']),
  Faq: (record) => textOf(record['faq_no']),
  Invoice: (record) => textOf(record['invoice_no']),
  Leads: (record) =>
    `${textOf(record['lead_no'])}: ${textOf(record['firstname'])} ${textOf(record['lastname'])}`,
  LineItem: (record) => textOf(record['productid']),
  ProductTaxes: (record) => `#${textOf(record['taxid'])} pid: ${textOf(record['productid'])}`,
  SalesOrder: (record) => textOf(record['salesorder_no']),
  Tax: (record) => textOf(record['taxname']),
  Users: (record) => textOf(record['user_name']),
};

export const DROPDOWN_RECORD_CAP = 100;
export const FIELD_PROP_CAP = 30;

export type VTigerAuthValue = AppConnectionValueForAuthProperty<typeof vtigerAuth>;

export interface Field {
  name: string;
  dblabel: string;
  label: string;
  default: string;
  mandatory: boolean;
  type: {
    name: string;
    length?: string;
    refersTo?: string[];
    picklistValues?: {
      label: string;
      value: string;
    }[];
  };
}
