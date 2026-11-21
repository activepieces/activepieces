import { twentyApi } from './api';
import {
  FieldPurpose,
  SelectOption,
  TwentyAuthValue,
  TwentyFieldRef,
  TwentyMetadataField,
  TwentyObjectRef,
} from './types';

const ALLOWED_SYSTEM_FIELDS = ['id', 'createdAt', 'updatedAt', 'deletedAt'];

const EXCLUDED_FIELD_TYPES = [
  'TS_VECTOR',
  'POSITION',
  'MORPH_RELATION',
  'FILES',
  'RAW_JSON',
];

const COMPOSITE_SUBFIELDS: Record<string, CompositeSubfield[]> = {
  FULL_NAME: [
    { key: 'firstName', label: 'First name', placeholder: 'John' },
    { key: 'lastName', label: 'Last name', placeholder: 'Doe' },
  ],
  ADDRESS: [
    {
      key: 'addressStreet1',
      label: 'Street',
      placeholder: 'Kattenburgerstraat 7',
    },
    { key: 'addressStreet2', label: 'Street 2', placeholder: 'building 039' },
    { key: 'addressCity', label: 'City', placeholder: 'Amsterdam' },
    {
      key: 'addressState',
      label: 'State/Province',
      placeholder: 'North Holland',
    },
    { key: 'addressCountry', label: 'Country', placeholder: 'Netherlands' },
    { key: 'addressPostcode', label: 'Post code', placeholder: '1018 JA' },
  ],
  EMAILS: [{ key: 'primaryEmail', label: 'Primary email' }],
  LINKS: [
    { key: 'primaryLinkLabel', label: 'Primary link label' },
    { key: 'primaryLinkUrl', label: 'Primary link URL' },
  ],
  PHONES: [
    {
      key: 'primaryPhoneNumber',
      label: 'Primary phone number',
      description: 'The number without the calling code.',
    },
    {
      key: 'primaryPhoneCountryCode',
      label: 'Primary phone country code',
      description: 'Two-letter country code, e.g. NL.',
    },
    {
      key: 'primaryPhoneCallingCode',
      label: 'Primary phone calling code',
      description: 'Calling code with a plus sign, e.g. +31.',
    },
  ],
  RICH_TEXT: [
    {
      key: 'markdown',
      label: 'Text',
      description: 'Compared against the text content of this field.',
    },
  ],
  CURRENCY: [
    {
      key: 'amountMicros',
      label: 'Amount (micros)',
      isNumber: true,
      description: 'The amount times 1,000,000, e.g. 12.50 is 12500000.',
    },
    {
      key: 'currencyCode',
      label: 'Currency code',
      description: 'Three-letter currency code, e.g. EUR.',
    },
  ],
  ACTOR: [
    { key: 'source', label: 'Source' },
    { key: 'name', label: 'Name' },
  ],
};

function getCompositeSubfields({
  field,
}: {
  field: TwentyMetadataField;
}): CompositeSubfield[] | undefined {
  return COMPOSITE_SUBFIELDS[field.type];
}

function resolveFieldTarget({
  field,
}: {
  field: TwentyMetadataField;
}): FieldTarget | undefined {
  const label =
    typeof field['label'] === 'string' ? field['label'] : field.name;
  if (field.type !== 'RELATION') return { key: field.name, label };
  const joinColumnName = field.settings?.['joinColumnName'];
  if (typeof joinColumnName !== 'string') return undefined;

  return { key: joinColumnName, label: `${label} ID` };
}

function buildSelectOptions({
  field,
}: {
  field: TwentyMetadataField;
}): SelectOption[] {
  return (field.options ?? []).flatMap((option) => {
    const value = option['value'];
    if (typeof value !== 'string') return [];
    const label = option['label'];
    return [{ label: typeof label === 'string' ? label : value, value }];
  });
}

function createTargetColumn({
  nameSingular,
}: {
  nameSingular: string;
}): string {
  return `target${nameSingular.charAt(0).toUpperCase()}${nameSingular.slice(
    1
  )}Id`;
}

function isObjectRef(value: unknown): value is TwentyObjectRef {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof value.id === 'string' &&
    'namePlural' in value &&
    typeof value.namePlural === 'string' &&
    'nameSingular' in value &&
    typeof value.nameSingular === 'string'
  );
}

function isFieldRef(value: unknown): value is TwentyFieldRef {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof value.id === 'string' &&
    'key' in value &&
    typeof value.key === 'string'
  );
}

async function objectOptions({
  auth,
}: {
  auth: TwentyAuthValue;
}): Promise<ObjectOption[]> {
  const objects = await twentyApi.listAllObjects({ auth });
  return objects.flatMap((object) => {
    const namePlural = object['namePlural'];
    const nameSingular = object['nameSingular'];
    if (
      object['isActive'] !== true ||
      object['isSystem'] !== false ||
      typeof namePlural !== 'string' ||
      typeof nameSingular !== 'string'
    )
      return [];
    const labelPlural = object['labelPlural'];
    return [
      {
        label: typeof labelPlural === 'string' ? labelPlural : namePlural,
        value: { id: object.id, namePlural, nameSingular },
      },
    ];
  });
}

async function fieldOptions({
  auth,
  objectId,
  purpose,
}: {
  auth: TwentyAuthValue;
  objectId: string;
  purpose: FieldPurpose;
}): Promise<FieldOption[]> {
  const fields = await twentyApi.getObjectFields({ auth, objectId });
  return fields
    .filter((field) => isFieldUsable({ field, purpose }))
    .flatMap((field) => {
      const target = resolveFieldTarget({ field });
      if (!target) return [];

      return [
        {
          label:
            typeof field['label'] === 'string' ? field['label'] : field.name,
          value: { id: field.id, key: target.key },
        },
      ];
    });
}

function isFieldUsable({
  field,
  purpose,
}: {
  field: TwentyMetadataField;
  purpose: FieldPurpose;
}): boolean {
  if (
    field['isActive'] !== true ||
    EXCLUDED_FIELD_TYPES.includes(field.type) ||
    resolveFieldTarget({ field }) === undefined
  )
    return false;
  if (purpose === 'write')
    return field['isSystem'] !== true && field['writability'] !== 'SYSTEM';
  return (
    field['isSystem'] !== true || ALLOWED_SYSTEM_FIELDS.includes(field.name)
  );
}

export const twentyMetadataUtils = {
  getCompositeSubfields,
  resolveFieldTarget,
  createTargetColumn,
  buildSelectOptions,
  isObjectRef,
  isFieldRef,
  objectOptions,
  fieldOptions,
};

export type CompositeSubfield = {
  key: string;
  label: string;
  description?: string;
  isNumber?: boolean;
  placeholder?: string;
};

export type FieldTarget = { key: string; label: string };

export type ObjectOption = { label: string; value: TwentyObjectRef };

export type FieldOption = { label: string; value: TwentyFieldRef };
