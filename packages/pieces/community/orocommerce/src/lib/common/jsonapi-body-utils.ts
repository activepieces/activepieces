function pickDefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v != null)
  ) as Partial<T>;
}

function omitEmptyObjects<T extends Record<string, unknown>>(
  obj: T
): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([, v]) =>
        !(
          v !== null &&
          typeof v === 'object' &&
          !Array.isArray(v) &&
          Object.keys(v).length === 0
        )
    )
  ) as Partial<T>;
}

function buildRels(
  map: Record<
    string,
    [type: string, id: string | string[] | null | undefined, many?: boolean]
  >
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(map)
      .filter(([, [, id]]) => id != null && id !== '' && (!Array.isArray(id) || id.length > 0))
      .map(([key, [type, id, many]]) => [
        key,
        Array.isArray(id)
          ? { data: id.filter((i) => i !== '').map((i) => ({ type, id: i })) }
          : many
          ? { data: [{ type, id }] }
          : { data: { type, id } },
      ])
  );
}

function parseAdditionalAttributes(
  raw: unknown
): Record<string, unknown> {
  if (raw == null) return {};
  const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
    throw new Error(
      'Additional Attributes must be a flat JSON object, e.g. {"myField": "value"}.'
    );
  }
  return parsed as Record<string, unknown>;
}

function parseAdditionalRelations(
  raw: unknown
): Record<string, unknown> {
  if (raw == null) return {};
  const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
    throw new Error(
      'Additional Relations must be a JSON object, e.g. {"myRelation": {"data": {"type": "myentities", "id": "1"}}}.'
    );
  }
  const obj = parsed as Record<string, unknown>;
  for (const [key, value] of Object.entries(obj)) {
    if (value === null) continue;
    if (typeof value !== 'object') {
      throw new Error(
        `Additional Relations: "${key}" must be a JSON:API linkage object with a "data" key, e.g. {"data": {"type": "myentities", "id": "1"}}.`
      );
    }
    const linkage = value as Record<string, unknown>;
    if (!('data' in linkage)) {
      throw new Error(
        `Additional Relations: "${key}" is missing the "data" key. Expected format: {"data": {"type": "myentities", "id": "1"}}.`
      );
    }
  }
  return obj;
}

export const jsonApiBodyUtils = { pickDefined, omitEmptyObjects, buildRels, parseAdditionalAttributes, parseAdditionalRelations };
