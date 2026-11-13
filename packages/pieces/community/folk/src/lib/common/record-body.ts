import { Property } from '@activepieces/pieces-framework';
import { folkAi } from './ai-common';
import { folkFields } from './fields';

function personProps({ forUpdate }: { forUpdate: boolean }) {
  return {
    firstName: Property.ShortText({ displayName: 'First Name', description: 'First name.', required: false }),
    lastName: Property.ShortText({ displayName: 'Last Name', description: 'Last name.', required: false }),
    fullName: Property.ShortText({
      displayName: 'Full Name',
      description: 'Full name. Use instead of first and last name when you only have one name string.',
      required: false,
    }),
    jobTitle: Property.ShortText({ displayName: 'Job Title', description: 'Job title.', required: false }),
    description: Property.LongText({ displayName: 'Description', description: 'Short description or bio.', required: false }),
    birthday: Property.ShortText({ displayName: 'Birthday', description: 'Birthday as YYYY-MM-DD.', required: false }),
    gender: Property.StaticDropdown({
      displayName: 'Gender',
      description: 'Gender.',
      required: false,
      options: { options: GENDERS.map((value) => ({ label: value, value })) },
    }),
    emails: folkAi.listProp({
      displayName: 'Emails',
      description: `Email addresses (max 20); the first is primary.${forUpdate ? REPLACES : ''}`,
    }),
    phones: folkAi.listProp({
      displayName: 'Phones',
      description: `Phone numbers (max 20); the first is primary.${forUpdate ? REPLACES : ''}`,
    }),
    urls: folkAi.listProp({ displayName: 'URLs', description: `Website or profile URLs (max 20).${forUpdate ? REPLACES : ''}` }),
    addresses: folkAi.listProp({
      displayName: 'Addresses',
      description: `Postal addresses, one per entry (max 20).${forUpdate ? REPLACES : ''}`,
    }),
    companyIds: folkAi.listProp({
      displayName: 'Company IDs',
      description: `IDs of existing companies (com_...). The first company is primary.${forUpdate ? REPLACES_COMPANIES : ''}`,
    }),
    companyNames: folkAi.listProp({
      displayName: 'Company Names',
      description: `Company names; Folk links a company with that name or creates it if none exists.${forUpdate ? REPLACES_COMPANIES : ''}`,
    }),
    groupIds: folkAi.listProp({
      displayName: 'Group IDs',
      description: `IDs of groups (grp_...) to put the person in. Get them from List Groups.${forUpdate ? GROUPS_UPDATE : ''}`,
    }),
    customFieldValues: customFieldValuesProp(),
  };
}

function companyProps({ forUpdate }: { forUpdate: boolean }) {
  return {
    description: Property.LongText({ displayName: 'Description', description: 'Short description.', required: false }),
    industry: Property.ShortText({ displayName: 'Industry', description: 'Industry.', required: false }),
    employeeRange: Property.StaticDropdown({
      displayName: 'Employee Range',
      description: 'Company size.',
      required: false,
      options: { options: EMPLOYEE_RANGES.map((value) => ({ label: value, value })) },
    }),
    foundationYear: Property.ShortText({ displayName: 'Foundation Year', description: 'Year founded, as YYYY.', required: false }),
    fundingRaised: Property.Number({ displayName: 'Funding Raised (USD)', description: 'Total funding raised in USD.', required: false }),
    lastFundingDate: Property.ShortText({
      displayName: 'Last Funding Date',
      description: 'Date of the last funding round, YYYY-MM-DD.',
      required: false,
    }),
    emails: folkAi.listProp({ displayName: 'Emails', description: `Email addresses (max 20); the first is primary.${forUpdate ? REPLACES : ''}` }),
    phones: folkAi.listProp({ displayName: 'Phones', description: `Phone numbers (max 20).${forUpdate ? REPLACES : ''}` }),
    urls: folkAi.listProp({ displayName: 'URLs', description: `Website URLs (max 20); the first is primary.${forUpdate ? REPLACES : ''}` }),
    addresses: folkAi.listProp({ displayName: 'Addresses', description: `Postal addresses (max 20).${forUpdate ? REPLACES : ''}` }),
    groupIds: folkAi.listProp({
      displayName: 'Group IDs',
      description: `IDs of groups (grp_...) to put the company in.${forUpdate ? GROUPS_UPDATE : ''}`,
    }),
    customFieldValues: customFieldValuesProp(),
  };
}

function customFieldValuesProp() {
  return Property.Json({
    displayName: 'Custom Field Values',
    description:
      'Optional group custom fields as {"grp_...": {"Field Name": value}}. Text/number/date: a value; single select: the option label; multiple select: a list of labels; contact, user or object fields: a list of {"id": "..."}. null or [] clears a field. Get field names from List Group Custom Fields. Groups used here are added to the record automatically.',
    required: false,
  });
}

function clearFieldsProp({ options }: { options: string[] }) {
  return Property.StaticMultiSelectDropdown({
    displayName: 'Clear Fields',
    description: 'Fields to empty. A field listed here is cleared even if a value is also given for it.',
    required: false,
    options: { options: options.map((value) => ({ label: value, value })) },
  });
}

function personBody({ props, clear }: { props: PersonInput; clear: string[] }): Record<string, unknown> {
  const body: Record<string, unknown> = {
    ...optionalText({ props, keys: ['firstName', 'lastName', 'fullName', 'jobTitle', 'description'] }),
    ...defined({ key: 'birthday', value: folkFields.dateValue({ value: props.birthday, label: 'Birthday' }) }),
    ...defined({ key: 'gender', value: enumValue({ value: props.gender, allowed: GENDERS, label: 'Gender' }) }),
    ...contactLists({ props }),
  };
  const companyIds = folkFields.idList({ value: props.companyIds, label: 'Company IDs', prefix: 'com_' });
  const companyNames = folkFields.stringList({ value: props.companyNames, label: 'Company Names' });
  if (companyIds !== undefined || companyNames !== undefined) {
    const companies = [...(companyIds ?? []).map((id) => ({ id })), ...(companyNames ?? []).map((name) => ({ name }))];
    if (companies.length > 0) {
      body['companies'] = companies;
    }
  }
  return applyClears({ body, clear, clearValues: PERSON_CLEAR_VALUES });
}

function companyBody({ props, clear }: { props: CompanyInput; clear: string[] }): Record<string, unknown> {
  const body: Record<string, unknown> = {
    ...optionalText({ props, keys: ['name', 'description', 'industry'] }),
    ...defined({ key: 'employeeRange', value: enumValue({ value: props.employeeRange, allowed: EMPLOYEE_RANGES, label: 'Employee Range' }) }),
    ...defined({ key: 'foundationYear', value: yearValue({ value: props.foundationYear }) }),
    ...defined({ key: 'fundingRaised', value: fundingValue({ value: props.fundingRaised }) }),
    ...defined({ key: 'lastFundingDate', value: folkFields.dateValue({ value: props.lastFundingDate, label: 'Last Funding Date' }) }),
    ...contactLists({ props }),
  };
  return applyClears({ body, clear, clearValues: COMPANY_CLEAR_VALUES });
}

function clearList({ value, allowed }: { value: unknown; allowed: string[] }): string[] {
  if (value === undefined || value === null || value === '') {
    return [];
  }
  const list = Array.isArray(value) ? value : [value];
  return list.map((entry) => {
    const name = String(entry);
    if (!allowed.includes(name)) {
      throw new Error(`Clear Fields can only contain: ${allowed.join(', ')}. "${name}" is not one.`);
    }
    return name;
  });
}

function applyClears({
  body,
  clear,
  clearValues,
}: {
  body: Record<string, unknown>;
  clear: string[];
  clearValues: Record<string, unknown>;
}): Record<string, unknown> {
  const cleared = Object.fromEntries(clear.filter((key) => key in clearValues).map((key) => [key, clearValues[key]]));
  return { ...body, ...cleared };
}

function optionalText<K extends string>({ props, keys }: { props: Partial<Record<K, unknown>>; keys: K[] }): Record<string, string> {
  return Object.fromEntries(
    keys.flatMap((key) => {
      const value = folkFields.textValue({ value: props[key] });
      return value === undefined ? [] : [[key, value]];
    })
  );
}

function contactLists({ props }: { props: ContactInput }): Record<string, string[]> {
  return Object.fromEntries(
    (['emails', 'phones', 'urls', 'addresses'] as const).flatMap((key) => {
      const values = folkFields.stringList({ value: props[key], label: LIST_LABELS[key] });
      return values === undefined || values.length === 0 ? [] : [[key, values]];
    })
  );
}

function defined({ key, value }: { key: string; value: unknown }): Record<string, unknown> {
  return value === undefined ? {} : { [key]: value };
}

function enumValue({ value, allowed, label }: { value: unknown; allowed: readonly string[]; label: string }): string | undefined {
  const text = folkFields.textValue({ value });
  if (text === undefined) {
    return undefined;
  }
  const match = allowed.find((option) => option.toLowerCase() === text.toLowerCase());
  if (!match) {
    throw new Error(`${label} must be one of: ${allowed.join(', ')}.`);
  }
  return match;
}

function yearValue({ value }: { value: unknown }): string | undefined {
  const text = folkFields.textValue({ value });
  if (text === undefined) {
    return undefined;
  }
  if (!/^\d{4}$/.test(text)) {
    throw new Error('Foundation Year must be a 4-digit year, e.g. 2015.');
  }
  return text;
}

function fundingValue({ value }: { value: unknown }): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error('Funding Raised must be a positive number in USD.');
  }
  return parsed;
}

const REPLACES = ' Replaces the whole current list, so include existing values you want to keep. Empty keeps the current list; use Clear Fields to empty it.';
const GROUPS_UPDATE =
  ' Replaces all current groups, so include the ones to keep. Empty keeps the current groups; to remove all, pick groups in Clear Fields. Leaving a group also deletes its custom field values.';
const REPLACES_COMPANIES = ' Company IDs and names together replace all current company links. Empty keeps the current links; use Clear Fields to remove them.';
const GENDERS = ['Male', 'Female', 'Unknown', 'Other'];
const EMPLOYEE_RANGES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5001-10000', '10000+'];
const LIST_LABELS = { emails: 'Emails', phones: 'Phones', urls: 'URLs', addresses: 'Addresses' };
const PERSON_CLEAR_VALUES: Record<string, unknown> = {
  jobTitle: '',
  description: '',
  birthday: '',
  gender: null,
  emails: [],
  phones: [],
  urls: [],
  addresses: [],
  companies: [],
  groups: [],
};
const COMPANY_CLEAR_VALUES: Record<string, unknown> = {
  emails: [],
  phones: [],
  urls: [],
  addresses: [],
  groups: [],
};

export const folkRecordBody = {
  personProps,
  companyProps,
  clearFieldsProp,
  clearList,
  personBody,
  companyBody,
  PERSON_CLEAR_FIELDS: Object.keys(PERSON_CLEAR_VALUES),
  COMPANY_CLEAR_FIELDS: Object.keys(COMPANY_CLEAR_VALUES),
};

type ContactInput = { emails?: unknown; phones?: unknown; urls?: unknown; addresses?: unknown };

export type PersonInput = ContactInput & {
  firstName?: unknown;
  lastName?: unknown;
  fullName?: unknown;
  jobTitle?: unknown;
  description?: unknown;
  birthday?: unknown;
  gender?: unknown;
  companyIds?: unknown;
  companyNames?: unknown;
};

export type CompanyInput = ContactInput & {
  name?: unknown;
  description?: unknown;
  industry?: unknown;
  employeeRange?: unknown;
  foundationYear?: unknown;
  fundingRaised?: unknown;
  lastFundingDate?: unknown;
};
