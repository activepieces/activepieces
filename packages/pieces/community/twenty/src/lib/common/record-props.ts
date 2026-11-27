import {
  InputProperty,
  MarkdownVariant,
  Property,
} from '@activepieces/pieces-framework';
import { twentyAuth } from '../auth';
import { PropParams } from './ai-props';
import { twentyApi } from './api';
import { recordParamsUtils } from './record-params';
import { twentyMetadataUtils } from './metadata';
import {
  FieldPurpose,
  QueryOperator,
  TwentyAuthValue,
  TwentyMetadataField,
} from './types';

const KEY = recordParamsUtils.fieldKeyFormat;

const TEXT_OPERATORS: QueryOperator[] = [
  'eq',
  'neq',
  'ilike',
  'like',
  'startsWith',
  'in',
];

const NUMBER_OPERATORS: QueryOperator[] = [
  'eq',
  'neq',
  'gt',
  'gte',
  'lt',
  'lte',
];

const CHOICE_OPERATORS: QueryOperator[] = ['eq', 'neq', 'in'];

const OPERATORS_BY_TYPE: Record<string, QueryOperator[]> = {
  NUMBER: NUMBER_OPERATORS,
  NUMERIC: NUMBER_OPERATORS,
  BOOLEAN: ['eq'],
  SELECT: CHOICE_OPERATORS,
  RATING: CHOICE_OPERATORS,
  RELATION: CHOICE_OPERATORS,
  UUID: CHOICE_OPERATORS,
  CURRENCY: ['eq', 'neq'],
  MULTI_SELECT: ['containsAny'],
  ARRAY: ['containsAny'],
  DATE_TIME: [],
  DATE: [],
};

const OPERATORS: Record<QueryOperator, OperatorDefinition> = {
  eq: { label: 'equals', description: 'Exact match.' },
  neq: { label: 'does not equal', description: 'Anything but this.' },
  in: { label: 'is any of', description: 'Comma-separated, e.g. A, B.' },
  is: { label: 'is', description: 'NULL or NOT_NULL.' },
  gt: { label: 'is greater than', description: 'Higher than this.' },
  gte: { label: 'is greater than or equal to', description: 'This or higher.' },
  lt: { label: 'is less than', description: 'Lower than this.' },
  lte: { label: 'is less than or equal to', description: 'This or lower.' },
  startsWith: { label: 'starts with', description: 'Begins with this.' },
  like: {
    label: 'matches (case-sensitive)',
    description: 'Use % as wildcard, e.g. %acme%.',
  },
  ilike: {
    label: 'matches (case-insensitive)',
    description: 'Use % as wildcard, e.g. %acme%.',
  },
  containsAny: { label: 'contains any of', description: 'At least one.' },
};

const TEXT_VALUE_DESCRIPTIONS: Record<FieldPurpose, string> = {
  filter: 'The text to compare against.',
  write: 'The value to set.',
};

const HEADING_PREFIXES: Record<FieldPurpose, string> = {
  filter: 'Filter',
  write: 'Set',
};

const VALUE_DESCRIPTIONS: Record<FieldPurpose, Record<string, string>> = {
  filter: {
    RELATION: 'The ID of the related record.',
    UUID: 'The ID to compare against.',
    NUMBER: 'The number to compare against.',
    NUMERIC: 'The number to compare against.',
    SELECT: 'The option to compare against.',
    RATING: 'The rating to compare against.',
    MULTI_SELECT: 'The options to compare against.',
    BOOLEAN:
      'Checked finds records where this is true, unchecked where it is false.',
  },
  write: {
    RELATION: 'The ID of the related record.',
    UUID: 'The ID to set.',
    NUMBER: 'The number to set.',
    NUMERIC: 'The number to set.',
    SELECT: 'The option to set.',
    RATING: 'The rating to set.',
    MULTI_SELECT: 'The options to set.',
    BOOLEAN: 'Checked sets true, unchecked sets false.',
  },
};

const DATE_PRESETS: DatePresetOption[] = [
  { label: 'Past day', value: -1 },
  { label: 'Past 7 days', value: -7 },
  { label: 'Past 30 days', value: -30 },
  { label: 'Within 1 day', value: 1 },
  { label: 'Within 7 days', value: 7 },
  { label: 'Within 30 days', value: 30 },
  { label: 'Custom', value: 'custom' },
];

function recordId<R extends boolean>({
  required,
  displayName = 'Record ID',
  description = 'The ID of the record, e.g. mapped from Find Records.',
}: PropParams<R>) {
  return Property.ShortText({
    required,
    displayName,
    description,
  });
}

function rewrite<R extends boolean>({
  required,
  displayName = 'Rewrite array fields',
  description = 'Replace list fields instead of adding the new values to them.',
}: PropParams<R>) {
  return Property.Checkbox({
    required,
    displayName,
    description,
    defaultValue: false,
  });
}

function object<R extends boolean>({
  required,
  displayName = 'Object',
  description = 'The type of record, e.g. People, Companies or one of your custom objects.',
}: PropParams<R>) {
  return Property.Dropdown({
    auth: twentyAuth,
    displayName,
    description,
    required,
    refreshers: ['auth'],
    options: async ({ auth }) => {
      if (!auth)
        return {
          disabled: true,
          options: [],
          placeholder: 'Connect your Twenty CRM.',
        };

      return { options: await twentyMetadataUtils.objectOptions({ auth }) };
    },
  });
}

function fields<R extends boolean>({
  required,
  displayName = 'Fields',
  description = 'The fields to use.',
  objectProp = 'object',
  purpose = 'filter',
}: FieldsPropParams<R>) {
  return Property.MultiSelectDropdown({
    auth: twentyAuth,
    displayName,
    description,
    required,
    refreshers: [objectProp],
    options: async ({ auth, [objectProp]: object }) => {
      if (!auth || !twentyMetadataUtils.isObjectRef(object))
        return {
          disabled: true,
          options: [],
          placeholder: 'Select an Object Type.',
        };

      return {
        options: await twentyMetadataUtils.fieldOptions({
          auth: auth,
          objectId: object.id,
          purpose,
        }),
      };
    },
  });
}

function filters<R extends boolean>({
  required,
  displayName = 'Filters',
  description = 'Set how each field is compared. Records must match every filter.',
  objectProp = 'object',
  fieldsProp = 'fields',
}: FieldInputsPropParams<R>) {
  return fieldInputs({
    required,
    displayName,
    description,
    objectProp,
    fieldsProp,
    purpose: 'filter',
  });
}

function values<R extends boolean>({
  required,
  displayName = 'Values',
  description = 'The values to set for each field.',
  objectProp = 'object',
  fieldsProp = 'fields',
}: FieldInputsPropParams<R>) {
  return fieldInputs({
    required,
    displayName,
    description,
    objectProp,
    fieldsProp,
    purpose: 'write',
  });
}

function fieldInputs<R extends boolean>({
  required,
  displayName,
  description,
  objectProp,
  fieldsProp,
  purpose,
}: {
  required: R;
  displayName: string;
  description: string;
  objectProp: string;
  fieldsProp: string;
  purpose: FieldPurpose;
}) {
  return Property.DynamicProperties({
    auth: twentyAuth,
    displayName,
    description,
    required,
    refreshers: [fieldsProp, objectProp],
    props: async ({ auth, [fieldsProp]: fieldRefs }) => {
      if (!auth || !Array.isArray(fieldRefs)) return {};

      const fieldIds = fieldRefs
        .filter(twentyMetadataUtils.isFieldRef)
        .map((ref) => ref.id);
      const fieldProps = await Promise.all(
        fieldIds.map((id) => buildFieldProps({ auth, fieldId: id, purpose }))
      );
      return Object.fromEntries(fieldProps.flat());
    },
  });
}

async function buildFieldProps({
  auth,
  fieldId,
  purpose,
}: {
  auth: TwentyAuthValue;
  fieldId: string;
  purpose: FieldPurpose;
}): Promise<[string, InputProperty][]> {
  const field = await twentyApi.getField({ auth, fieldId });
  const target = twentyMetadataUtils.resolveFieldTarget({ field });
  if (!target) return [];

  const operatorOptions =
    purpose === 'filter'
      ? (OPERATORS_BY_TYPE[field.type] ?? TEXT_OPERATORS).map((operator) => ({
          label: OPERATORS[operator].label,
          description: OPERATORS[operator].description,
          value: operator,
        }))
      : [];

  const operatorProps: [string, InputProperty][] =
    operatorOptions.length === 0
      ? []
      : [
          [
            `${target.key}${KEY.delimiter}${KEY.operator}`,
            Property.StaticDropdown({
              displayName: 'Condition',
              description: 'How the value below is compared.',
              required: true,
              options: { options: operatorOptions },
            }),
          ],
        ];
  return [
    [
      `${target.key}${KEY.delimiter}${KEY.header}`,
      Property.MarkDown({
        value: `---\n\n### ${HEADING_PREFIXES[purpose]} ${target.label}`,
        variant: MarkdownVariant.BORDERLESS,
      }),
    ],
    ...operatorProps,
    ...buildValueProps({ field, purpose }),
  ];
}

function buildValueProps({
  field,
  purpose,
}: {
  field: TwentyMetadataField;
  purpose: FieldPurpose;
}): [string, InputProperty][] {
  const target = twentyMetadataUtils.resolveFieldTarget({ field });
  if (!target) return [];

  const subfields = twentyMetadataUtils.getCompositeSubfields({ field });
  if (subfields) {
    return subfields.map(
      ({ key, label, isNumber, placeholder, description }) => {
        const subfieldParams = {
          displayName: label,
          description,
          required: false,
          placeholder,
        };
        return [
          `${target.key}${KEY.delimiter}${key}`,
          isNumber
            ? Property.Number(subfieldParams)
            : Property.ShortText(subfieldParams),
        ];
      }
    );
  }

  const params = {
    displayName: 'Value',
    description:
      VALUE_DESCRIPTIONS[purpose][field.type] ??
      TEXT_VALUE_DESCRIPTIONS[purpose],
    required: purpose === 'filter',
  };
  const valueKey = `${target.key}${KEY.delimiter}${KEY.value}`;
  const options = twentyMetadataUtils.buildSelectOptions({ field });

  switch (field.type) {
    case 'NUMBER':
    case 'NUMERIC':
      return [[valueKey, Property.Number(params)]];
    case 'DATE':
    case 'DATE_TIME':
      return buildDateProps({ key: target.key, purpose });
    case 'MULTI_SELECT':
      return [
        [
          valueKey,
          Property.StaticMultiSelectDropdown({
            ...params,
            options: { options },
          }),
        ],
      ];
    case 'SELECT':
    case 'RATING':
      return [
        [
          valueKey,
          Property.StaticDropdown({ ...params, options: { options } }),
        ],
      ];
    case 'BOOLEAN':
      return [[valueKey, Property.Checkbox(params)]];
    default:
      return [[valueKey, Property.ShortText(params)]];
  }
}

function buildDateProps({
  key,
  purpose,
}: {
  key: string;
  purpose: FieldPurpose;
}): [string, InputProperty][] {
  const placeholder = '2026-11-01';

  if (purpose === 'write')
    return [
      [
        `${key}${KEY.delimiter}${KEY.value}`,
        Property.DateTime({
          displayName: 'Date',
          description: 'The date to set.',
          placeholder,
          required: true,
        }),
      ],
    ];

  return [
    [
      `${key}${KEY.delimiter}${KEY.preset}`,
      Property.StaticDropdown({
        displayName: 'Range',
        description: 'Which dates to match.',
        required: true,
        options: { options: DATE_PRESETS },
      }),
    ],
    [
      `${key}${KEY.delimiter}${KEY.after}`,
      Property.DateTime({
        displayName: 'From',
        description: 'Only used when Custom is selected.',
        placeholder,
        required: false,
        width: 'half',
      }),
    ],
    [
      `${key}${KEY.delimiter}${KEY.before}`,
      Property.DateTime({
        displayName: 'To',
        description: 'Only used when Custom is selected.',
        placeholder,
        required: false,
        width: 'half',
      }),
    ],
  ];
}

function limitEnabled({ description }: { description: string }) {
  return Property.Checkbox({
    displayName: 'Limit records',
    description,
    required: false,
    defaultValue: false,
    advanced: true,
  });
}

function limit({ description }: { description: string }) {
  return Property.DynamicProperties({
    auth: twentyAuth,
    displayName: 'Limit',
    required: false,
    advanced: true,
    refreshers: ['limitEnabled'],
    props: async ({ limitEnabled }): Promise<Record<string, InputProperty>> => {
      if (limitEnabled === false) return {};
      return {
        limit: Property.Number({
          displayName: 'Maximum records',
          description,
          required: false,
          defaultValue: recordParamsUtils.recordLimit.default,
          min: recordParamsUtils.recordLimit.min,
          display: 'stepper',
        }),
      };
    },
  });
}

export const twentyRecordProps = {
  recordId,
  rewrite,
  object,
  fields,
  filters,
  values,
  limitEnabled,
  limit,
};

export type FieldsPropParams<R extends boolean> = PropParams<R> & {
  objectProp?: string;
  purpose?: FieldPurpose;
};

export type FieldInputsPropParams<R extends boolean> = PropParams<R> & {
  objectProp?: string;
  fieldsProp?: string;
};

type OperatorDefinition = { label: string; description: string };

type DatePresetOption = { label: string; value: number | 'custom' };
