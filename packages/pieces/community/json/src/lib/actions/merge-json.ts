import { createAction, Property } from '@activepieces/pieces-framework';

export const mergeJson = createAction({
  audience: 'human',
  name: 'merge_json',
  displayName: 'Merge JSON Objects',
  description:
    'Combine an array of JSON objects into a single object using a per-field merge strategy.',
  aiMetadata: {
    description:
      'Reduce an array of JSON objects into one object. For each field choose how conflicting values are resolved — first found, last found, most frequent, minimum, maximum, or concatenate into an array — with a default strategy for any field not listed. Use when stitching together objects extracted from document chunks or paginated results. Pure transform; safe to retry.',
    idempotent: true,
  },
  props: {
    jsonArray: Property.Json({
      displayName: 'Objects to Merge',
      description:
        'An array of JSON objects to merge, e.g. [{"title":"Q1","total":10},{"total":12,"author":"Jane"}]. Map the array output of a previous step here.',
      required: true,
    }),
    defaultStrategy: Property.StaticDropdown({
      displayName: 'Default Strategy',
      description:
        'How to resolve any field not listed below. "Last found" mirrors a plain object merge where later objects win.',
      required: true,
      defaultValue: 'last',
      options: buildStrategyOptions(),
    }),
    fieldStrategies: Property.Array({
      displayName: 'Field Strategies',
      description:
        'Override the default strategy for specific fields. Each row maps one field name to a strategy.',
      required: false,
      properties: {
        field: Property.ShortText({
          displayName: 'Field Name',
          description: 'The exact key to apply this strategy to, e.g. "total".',
          required: true,
        }),
        strategy: Property.StaticDropdown({
          displayName: 'Strategy',
          required: true,
          options: buildStrategyOptions(),
        }),
      },
    }),
  },
  async run(context) {
    const { jsonArray, defaultStrategy, fieldStrategies } = context.propsValue;

    const objects = normalizeObjectArray(jsonArray);
    const overrides = buildStrategyMap(fieldStrategies);
    const fallback = isMergeStrategy(defaultStrategy)
      ? defaultStrategy
      : 'last';

    return mergeObjects({ objects, defaultStrategy: fallback, overrides });
  },
});

function buildStrategyOptions() {
  return {
    options: [
      { label: 'First found', value: 'first' },
      { label: 'Last found', value: 'last' },
      { label: 'Most frequent', value: 'most_frequent' },
      { label: 'Minimum', value: 'min' },
      { label: 'Maximum', value: 'max' },
      { label: 'Concatenate into array', value: 'concat' },
    ],
  };
}

function normalizeObjectArray(input: unknown): Record<string, unknown>[] {
  const parsed = typeof input === 'string' ? safeParse(input) : input;
  if (!Array.isArray(parsed)) {
    throw new Error('"Objects to Merge" must be an array of JSON objects.');
  }
  const objects = parsed.filter((item) => !isNil(item));
  if (objects.some((item) => !isPlainObject(item))) {
    throw new Error('Every item in "Objects to Merge" must be a JSON object.');
  }
  return objects.filter(isPlainObject);
}

function safeParse(input: string): unknown {
  try {
    return JSON.parse(input);
  } catch {
    throw new Error('"Objects to Merge" is not valid JSON.');
  }
}

function buildStrategyMap(rows: unknown): Record<string, MergeStrategy> {
  if (!Array.isArray(rows)) {
    return {};
  }
  return rows.reduce<Record<string, MergeStrategy>>((map, row) => {
    if (isPlainObject(row)) {
      const field = row['field'];
      const strategy = row['strategy'];
      if (
        typeof field === 'string' &&
        field.length > 0 &&
        isMergeStrategy(strategy)
      ) {
        return { ...map, [field]: strategy };
      }
    }
    return map;
  }, {});
}

function mergeObjects({
  objects,
  defaultStrategy,
  overrides,
}: {
  objects: Record<string, unknown>[];
  defaultStrategy: MergeStrategy;
  overrides: Record<string, MergeStrategy>;
}): Record<string, unknown> {
  const fields = collectFields(objects);
  return fields.reduce<Record<string, unknown>>((merged, field) => {
    const values = collectValues({ objects, field });
    const strategy = overrides[field] ?? defaultStrategy;
    return { ...merged, [field]: applyStrategy({ values, strategy }) };
  }, {});
}

function collectFields(objects: Record<string, unknown>[]): string[] {
  const seen = new Set<string>();
  const fields: string[] = [];
  for (const object of objects) {
    for (const key of Object.keys(object)) {
      if (!seen.has(key)) {
        seen.add(key);
        fields.push(key);
      }
    }
  }
  return fields;
}

function collectValues({
  objects,
  field,
}: {
  objects: Record<string, unknown>[];
  field: string;
}): unknown[] {
  return objects
    .filter((object) => field in object && !isNil(object[field]))
    .map((object) => object[field]);
}

function applyStrategy({
  values,
  strategy,
}: {
  values: unknown[];
  strategy: MergeStrategy;
}): unknown {
  switch (strategy) {
    case 'concat':
      return concatValues(values);
    case 'first':
      return values.length === 0 ? null : values[0];
    case 'last':
      return values.length === 0 ? null : values[values.length - 1];
    case 'most_frequent':
      return values.length === 0 ? null : mostFrequent(values);
    case 'min':
      return values.length === 0
        ? null
        : values.reduce((min, value) =>
            compareValues(value, min) < 0 ? value : min
          );
    case 'max':
      return values.length === 0
        ? null
        : values.reduce((max, value) =>
            compareValues(value, max) > 0 ? value : max
          );
  }
}

function concatValues(values: unknown[]): unknown[] {
  return values.flatMap((value) => (Array.isArray(value) ? value : [value]));
}

function mostFrequent(values: unknown[]): unknown {
  const counts = new Map<string, { count: number; value: unknown }>();
  for (const value of values) {
    const key = canonicalKey(value);
    const entry = counts.get(key);
    if (entry) {
      entry.count += 1;
    } else {
      counts.set(key, { count: 1, value });
    }
  }
  let best: { count: number; value: unknown } | undefined;
  for (const entry of counts.values()) {
    if (!best || entry.count > best.count) {
      best = entry;
    }
  }
  return best?.value ?? null;
}

function compareValues(a: unknown, b: unknown): number {
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }
  const aComparable = toComparable(a);
  const bComparable = toComparable(b);
  if (aComparable < bComparable) {
    return -1;
  }
  if (aComparable > bComparable) {
    return 1;
  }
  return 0;
}

function toComparable(value: unknown): string {
  return typeof value === 'string' ? value : canonicalKey(value);
}

function canonicalKey(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalKey).join(',')}]`;
  }
  if (isPlainObject(value)) {
    const entries = Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalKey(value[key])}`);
    return `{${entries.join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

function isMergeStrategy(value: unknown): value is MergeStrategy {
  return (
    value === 'first' ||
    value === 'last' ||
    value === 'most_frequent' ||
    value === 'min' ||
    value === 'max' ||
    value === 'concat'
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNil(value: unknown): boolean {
  return value === null || value === undefined;
}

type MergeStrategy =
  | 'first'
  | 'last'
  | 'most_frequent'
  | 'min'
  | 'max'
  | 'concat';
