interface FirestoreValue {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  timestampValue?: string;
  arrayValue?: { values?: FirestoreValue[] };
  mapValue?: { fields?: Record<string, FirestoreValue> };
  nullValue?: string;
}

export const convertToFirestoreValues = (
  obj: unknown
): Record<string, FirestoreValue> => {
  if (typeof obj !== 'object' || obj === null) {
    return {};
  }

  const fields: Record<string, FirestoreValue> = {};

  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    fields[key] = convertValue(value);
  }

  return fields;
};

export const convertValue = (value: unknown): FirestoreValue => {
  if (value === null) {
    return { nullValue: 'NULL_VALUE' };
  }

  if (typeof value === 'string') {
    return { stringValue: value };
  }

  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return { integerValue: value.toString() };
    }
    return { doubleValue: value };
  }

  if (typeof value === 'boolean') {
    return { booleanValue: value };
  }

  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map(convertValue),
      },
    };
  }

  if (typeof value === 'object') {
    const mapFields: Record<string, FirestoreValue> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      mapFields[k] = convertValue(v);
    }
    return {
      mapValue: {
        fields: mapFields,
      },
    };
  }

  return { nullValue: 'NULL_VALUE' };
};
