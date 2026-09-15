export const kickcallRowValues = {
  toPartialRowValues,
  applyClearedColumns,
};

function toPartialRowValues(values: unknown): Record<string, string> {
  if (typeof values !== 'object' || values === null || Array.isArray(values)) {
    throw new Error('Values must be an object of column fields');
  }
  const typedValues: Record<string, string> = {};
  for (const [columnId, value] of Object.entries(values)) {
    if (value === undefined || value === null) {
      continue;
    }
    const text = String(value);
    if (text.trim().length === 0) {
      continue;
    }
    typedValues[columnId] = text;
  }
  return typedValues;
}

function applyClearedColumns({
  values,
  columnIds,
}: {
  values: Record<string, string>;
  columnIds: unknown;
}): Record<string, string> {
  if (!Array.isArray(columnIds) || columnIds.length === 0) {
    return values;
  }
  const nextValues = { ...values };
  for (const columnId of columnIds) {
    if (typeof columnId !== 'string' && typeof columnId !== 'number') {
      continue;
    }
    nextValues[String(columnId)] = '';
  }
  return nextValues;
}
