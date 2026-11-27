import { Property } from '@activepieces/pieces-framework';
import { sageIntacctAuth } from '../auth';
import { QueryFilter, sageIntacctClient } from './client';

const DROPDOWN_LIMIT = 500;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function recordDropdown({
  object,
  displayName,
  description,
  labelPaths = ['name'],
  orderBy = [{ name: 'asc' }],
  searchPaths,
}: {
  object: string;
  displayName: string;
  description: string;
  labelPaths?: string[];
  orderBy?: Record<string, 'asc' | 'desc'>[];
  searchPaths?: string[];
}) {
  return Property.Dropdown({
    auth: sageIntacctAuth,
    displayName,
    description,
    required: true,
    refreshers: [],
    refreshOnSearch: true,
    options: async ({ auth }, context) => {
      if (!auth) {
        return { disabled: true, placeholder: 'Connect your Sage Intacct account first.', options: [] };
      }
      const query = buildDropdownQuery({ labelPaths, searchPaths, searchValue: context.searchValue });
      const { records } = await sageIntacctClient.queryAll({
        auth,
        object,
        fields: query.fields,
        filters: query.filters,
        filterExpression: query.filterExpression,
        orderBy,
        limit: DROPDOWN_LIMIT,
      });
      return {
        disabled: false,
        options: records
          .map((record) => {
            const parts = labelPaths
              .map((path) => sageIntacctClient.readString({ record, path }))
              .filter((part): part is string => part !== null && part !== '');
            const id = sageIntacctClient.readString({ record, path: 'id' });
            return {
              key: sageIntacctClient.readString({ record, path: 'key' }),
              label: `${parts.length > 0 ? parts.join(' — ') : id ?? ''} (${id ?? ''})`,
            };
          })
          .filter((option): option is { key: string; label: string } => option.key !== null)
          .map((option) => ({ label: option.label, value: option.key })),
      };
    },
  });
}

function dateProp({ displayName, required, description }: { displayName: string; required: boolean; description?: string }) {
  return Property.ShortText({
    displayName,
    required,
    description: description ?? `${displayName} in YYYY-MM-DD format.`,
  });
}

function parseIsoDate({ value, label }: { value: string | null | undefined; label: string }): string | undefined {
  const date = trimmed(value);
  if (date === undefined) {
    return undefined;
  }
  if (!ISO_DATE_PATTERN.test(date) || Number.isNaN(Date.parse(date)) || new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date) {
    throw new Error(`${label} must be a valid date in YYYY-MM-DD format, got "${date}".`);
  }
  return date;
}

function lineItemsProp() {
  return Property.Array({
    displayName: 'Lines',
    description: 'Invoice or bill lines. Each line needs a GL account ID and an amount.',
    required: true,
    properties: {
      gl_account_id: Property.ShortText({
        displayName: 'GL Account ID',
        description: 'Account number from your Sage Intacct chart of accounts, for example 4000.',
        required: true,
      }),
      amount: Property.Number({ displayName: 'Amount', required: true }),
      memo: Property.ShortText({ displayName: 'Memo', required: false }),
      location_id: Property.ShortText({
        displayName: 'Location ID',
        description: 'Location ID from Sage Intacct, for example 100. Required when the GL account demands a location.',
        required: false,
      }),
      department_id: Property.ShortText({ displayName: 'Department ID', required: false }),
    },
  });
}

function parseLineItems({
  value,
  label,
  extraDimensions,
}: {
  value: unknown;
  label: string;
  extraDimensions?: Record<string, unknown>;
}): Record<string, unknown>[] {
  let parsed = value;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      throw new Error(`${label} must be a JSON array of lines, got unparseable text.`);
    }
  }
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error(`${label} must be a non-empty array of lines.`);
  }
  return parsed.map((entry, index) => {
    if (!sageIntacctClient.isRecord(entry)) {
      throw new Error(`${label}[${index}] must be an object with gl_account_id and amount.`);
    }
    const glAccountId = recordKey(entry['gl_account_id']);
    if (glAccountId === undefined) {
      throw new Error(`${label}[${index}].gl_account_id is required.`);
    }
    const rawAmount = entry['amount'];
    const amount = typeof rawAmount === 'number' ? rawAmount : typeof rawAmount === 'string' && rawAmount.trim() !== '' ? Number(rawAmount) : NaN;
    const rounded = Number.isFinite(amount) ? Math.round(amount * 100) / 100 : NaN;
    if (!Number.isFinite(rounded) || rounded === 0) {
      throw new Error(`${label}[${index}].amount must be a number that is not zero after rounding to 2 decimals, got ${JSON.stringify(rawAmount)}.`);
    }
    const memo = trimmed(typeof entry['memo'] === 'string' ? entry['memo'] : undefined);
    const locationId = recordKey(entry['location_id']);
    const departmentId = recordKey(entry['department_id']);
    return compact({
      glAccount: { id: glAccountId },
      txnAmount: rounded.toFixed(2),
      memo,
      dimensions: compact({
        ...(extraDimensions ?? {}),
        location: locationId !== undefined ? { id: locationId } : undefined,
        department: departmentId !== undefined ? { id: departmentId } : undefined,
      }),
    });
  });
}

function buildDropdownQuery({
  labelPaths,
  searchPaths,
  searchValue,
}: {
  labelPaths: string[];
  searchPaths?: string[];
  searchValue?: string;
}): { fields: string[]; filters?: QueryFilter[]; filterExpression?: string } {
  const search = trimmed(searchValue);
  const searchFields = Array.from(new Set(searchPaths ?? [labelPaths[0], 'id']));
  return {
    fields: Array.from(new Set(['key', 'id', ...labelPaths])),
    filters: search !== undefined ? searchFields.map((path) => ({ $contains: { [path]: search } })) : undefined,
    filterExpression: search !== undefined && searchFields.length > 1 ? searchFields.map((_, index) => String(index + 1)).join(' or ') : undefined,
  };
}

function recordKey(value: unknown): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return trimmed(typeof value === 'string' ? value : undefined);
}

function text({ displayName, description, required }: { displayName: string; description?: string; required?: boolean }) {
  return Property.ShortText({ displayName, description, required: required ?? false });
}

function addressProps() {
  return {
    address_line_1: text({ displayName: 'Address Line 1' }),
    address_line_2: text({ displayName: 'Address Line 2' }),
    city: text({ displayName: 'City' }),
    state: text({ displayName: 'State / Province' }),
    postal_code: text({ displayName: 'Postal Code' }),
    country: text({ displayName: 'Country' }),
  };
}

function contactInfoProps() {
  return {
    print_as: text({ displayName: 'Print As', description: 'Name printed on documents. When creating, defaults to the name.' }),
    company_name: text({ displayName: 'Company Name' }),
    first_name: text({ displayName: 'First Name' }),
    last_name: text({ displayName: 'Last Name' }),
    email: text({ displayName: 'Email' }),
    phone: text({ displayName: 'Phone' }),
    ...addressProps(),
  };
}

function statusProp() {
  return Property.StaticDropdown({
    displayName: 'Status',
    description: 'Leave empty to keep the current status; new records default to active.',
    required: false,
    options: {
      disabled: false,
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ],
    },
  });
}

function compact(values: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => {
      if (value === undefined || value === null || value === '') {
        return false;
      }
      return !(sageIntacctClient.isRecord(value) && Object.keys(value).length === 0);
    }),
  );
}

function trimmed(value: string | null | undefined): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const result = value.trim();
  return result === '' ? undefined : result;
}

function buildAddress(values: AddressValues): Record<string, unknown> {
  return compact({
    addressLine1: trimmed(values.address_line_1),
    addressLine2: trimmed(values.address_line_2),
    city: trimmed(values.city),
    state: trimmed(values.state),
    postCode: trimmed(values.postal_code),
    country: trimmed(values.country),
  });
}

function buildContactInfo(values: ContactInfoValues): Record<string, unknown> {
  return compact({
    printAs: trimmed(values.print_as),
    companyName: trimmed(values.company_name),
    firstName: trimmed(values.first_name),
    lastName: trimmed(values.last_name),
    email1: trimmed(values.email),
    phone1: trimmed(values.phone),
    mailingAddress: buildAddress(values),
  });
}

function buildPartyBody({ id, name, status, contact }: { id?: string | null; name?: string | null; status?: string | null; contact: ContactInfoValues }): Record<string, unknown> {
  const contactInfo = buildContactInfo(contact);
  return compact({
    id: trimmed(id),
    name: trimmed(name),
    status: trimmed(status),
    contacts: Object.keys(contactInfo).length > 0 ? { default: contactInfo } : undefined,
  });
}

export const sageIntacctProps = {
  recordDropdown,
  text,
  dateProp,
  lineItemsProp,
  addressProps,
  contactInfoProps,
  statusProp,
};

export const sageIntacctBodies = {
  compact,
  trimmed,
  recordKey,
  buildDropdownQuery,
  parseIsoDate,
  parseLineItems,
  buildAddress,
  buildContactInfo,
  buildPartyBody,
};

export type AddressValues = {
  address_line_1?: string | null;
  address_line_2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
};
export type ContactInfoValues = AddressValues & {
  print_as?: string | null;
  company_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
};
