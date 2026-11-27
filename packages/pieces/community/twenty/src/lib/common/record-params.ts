import {
  QueryCondition,
  QueryConditionNode,
  QueryOperator,
  FieldValue,
} from './types';

const fieldKeyFormat = {
  delimiter: '_',
  value: 'value',
  operator: 'operator',
  header: 'header',
  preset: 'preset',
  after: 'after',
  before: 'before',
} as const;

const recordLimit = { min: 1, default: 60 } as const;

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const ADDITIONAL_VALUE_SUBFIELDS: Record<string, string> = {
  primaryEmail: 'additionalEmails',
  primaryLinkUrl: 'secondaryLinks',
  primaryPhoneNumber: 'additionalPhones',
};

const LIST_OPERATORS: QueryOperator[] = ['in', 'containsAny'];

const QUERY_OPERATORS: Record<QueryOperator, true> = {
  eq: true,
  neq: true,
  in: true,
  is: true,
  gt: true,
  gte: true,
  lt: true,
  lte: true,
  startsWith: true,
  like: true,
  ilike: true,
  containsAny: true,
};

function groupInputsByField({
  input,
  delimiter,
}: {
  input: FlatInputs;
  delimiter: string;
}): InputsByField {
  return Object.entries(input).reduce<InputsByField>(
    (grouped, [key, value]) => {
      const index = key.lastIndexOf(delimiter);
      if (index <= 0) return grouped;
      const field = key.slice(0, index);
      const part = key.slice(index + delimiter.length);
      return {
        ...grouped,
        [field]: { ...grouped[field], [part]: value },
      };
    },
    {}
  );
}

function parseQueryConditions({
  input,
}: {
  input: FlatInputs;
}): QueryConditionNode[] {
  const grouped = groupInputsByField({
    input,
    delimiter: fieldKeyFormat.delimiter,
  });

  return Object.entries(grouped).flatMap(([field, inputs]) => {
    if (inputs[fieldKeyFormat.preset] !== undefined)
      return toDateRangeConditions({ field, inputs });

    const { operator, header: _header, ...values } = inputs;
    return Object.entries(values).flatMap(
      ([part, value]): QueryConditionNode[] => {
        if (!isQueryOperator(operator) || !isFieldValue(value)) return [];

        const path = part === fieldKeyFormat.value ? field : `${field}.${part}`;
        const condition: QueryCondition = {
          field: path,
          operator,
          value: splitListValue({ operator, value }),
        };
        if (isEmptyValue(condition.value)) return [];

        const additionalSubfield = ADDITIONAL_VALUE_SUBFIELDS[part];
        return [
          additionalSubfield
            ? expandToAdditionalValues({
                condition,
                additionalField: `${field}.${additionalSubfield}`,
              })
            : condition,
        ];
      }
    );
  });
}

function parseRecordValues({
  input,
}: {
  input: FlatInputs;
}): Record<string, unknown> {
  const grouped = groupInputsByField({
    input,
    delimiter: fieldKeyFormat.delimiter,
  });
  return Object.fromEntries(
    Object.entries(grouped).flatMap(([field, inputs]) => {
      const {
        operator: _operator,
        header: _header,
        value,
        ...subfields
      } = inputs;
      if (!isEmptyValue(value)) return [[field, value]];
      const filled = Object.entries(subfields).filter(
        ([, subfieldValue]) => !isEmptyValue(subfieldValue)
      );
      return filled.length > 0 ? [[field, Object.fromEntries(filled)]] : [];
    })
  );
}

function expandToAdditionalValues({
  condition,
  additionalField,
}: {
  condition: QueryCondition;
  additionalField: string;
}): QueryConditionNode {
  const additionalConditions = additionalValuePatterns({
    operator: condition.operator,
    value: condition.value,
  }).map(
    (pattern): QueryCondition => ({
      field: additionalField,
      operator: condition.operator === 'ilike' ? 'ilike' : 'like',
      value: pattern,
    })
  );

  if (additionalConditions.length === 0) return condition;
  if (condition.operator !== 'neq')
    return {
      conjunction: 'or',
      conditions: [condition, ...additionalConditions],
    };

  return {
    conjunction: 'and',
    conditions: [
      condition,
      {
        conjunction: 'or',
        conditions: [
          { conjunction: 'not', conditions: additionalConditions },
          { field: additionalField, operator: 'is', value: 'NULL' },
        ],
      },
    ],
  };
}

function additionalValuePatterns({
  operator,
  value,
}: {
  operator: QueryOperator;
  value: FieldValue | undefined;
}): string[] {
  const items = Array.isArray(value) ? value : [value];
  return items.flatMap((item) => {
    if (typeof item !== 'string' || item === '') return [];
    switch (operator) {
      case 'eq':
      case 'neq':
      case 'in':
        return [`%"${escapeLikeValue(item)}"%`];
      case 'startsWith':
        return [`%"${escapeLikeValue(item)}%`];
      case 'like':
      case 'ilike':
        return [item.includes('%') ? item : `%"${escapeLikeValue(item)}"%`];
      default:
        return [];
    }
  });
}

function escapeLikeValue(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&');
}

function toDateRangeConditions({
  field,
  inputs,
}: {
  field: string;
  inputs: FieldInputs;
}): QueryCondition[] {
  const preset = inputs[fieldKeyFormat.preset];
  if (typeof preset === 'number') {
    const now = Date.now();
    const shifted = new Date(now + preset * DAY_IN_MS).toISOString();
    const current = new Date(now).toISOString();
    return [
      { field, operator: 'gte', value: preset < 0 ? shifted : current },
      { field, operator: 'lte', value: preset < 0 ? current : shifted },
    ];
  }

  if (preset !== 'custom') return [];

  return [
    {
      field,
      operator: 'gte',
      value: toDateValue(inputs[fieldKeyFormat.after]),
    },
    {
      field,
      operator: 'lte',
      value: toDateValue(inputs[fieldKeyFormat.before]),
    },
  ];
}

function toDateValue(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function splitListValue({
  operator,
  value,
}: {
  operator: QueryOperator;
  value: FieldValue;
}): FieldValue {
  if (!LIST_OPERATORS.includes(operator) || typeof value !== 'string')
    return value;
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function isEmptyValue(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  );
}

function isQueryOperator(value: unknown): value is QueryOperator {
  return typeof value === 'string' && value in QUERY_OPERATORS;
}

function isFieldValue(value: unknown): value is FieldValue {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    (Array.isArray(value) && value.every((item) => typeof item === 'string'))
  );
}

function parseLimit({
  enabled,
  input,
}: {
  enabled: unknown;
  input: unknown;
}): number | undefined {
  if (enabled === false) return undefined;
  if (typeof input !== 'number' || !Number.isFinite(input))
    return recordLimit.default;
  return Math.max(Math.trunc(input), recordLimit.min);
}

export const recordParamsUtils = {
  fieldKeyFormat,
  recordLimit,
  parseQueryConditions,
  parseRecordValues,
  parseLimit,
};

export type FlatInputs = {
  [fieldDelimiterPart: string]: unknown;
};

export type FieldInputs = {
  operator?: unknown;
  header?: unknown;
  value?: unknown;
  [subfield: string]: unknown;
};

export type InputsByField = {
  [field: string]: FieldInputs;
};
