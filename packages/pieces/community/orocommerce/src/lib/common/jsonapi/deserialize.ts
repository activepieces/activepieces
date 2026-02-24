import type { JsonApiDocument, JsonApiResource, Linkage, FlatResource, DeserializeResult } from './types';

/**
 * Sentinel value written by the deserializer for a null to-one relationship.
 * Carrying `_type: null` lets the serializer distinguish it from a plain
 * null attribute and round-trip it back to `{ data: null }`.
 */
export const NULL_RELATIONSHIP: FlatResource = Object.freeze({ _type: null, id: null });

// -- internal helpers -------------------------------------------------------

function buildIndex(included: JsonApiResource[]): Map<string, JsonApiResource> {
  const m = new Map<string, JsonApiResource>();
  for (const r of included) m.set(`${r.type}:${r.id}`, r);
  return m;
}

function resolveRef(
  ref: Linkage,
  index: Map<string, JsonApiResource>,
  visited: Set<string>,
): FlatResource {
  const key = `${ref.type}:${ref.id}`;
  // cycle guard or not in included -> minimal restorable stub
  if (visited.has(key)) return { _type: ref.type, id: ref.id };
  const resource = index.get(key);
  if (resource) return flattenResource(resource, index, new Set(visited));
  return { _type: ref.type, id: ref.id };
}

function flattenResource(
  r: JsonApiResource,
  index: Map<string, JsonApiResource>,
  visited: Set<string>,
): FlatResource {
  visited.add(`${r.type}:${r.id}`);
  const out: FlatResource = { ...r.attributes, _type: r.type, id: r.id };
  for (const [name, rel] of Object.entries(r.relationships ?? {})) {
    const lnk = rel.data;
    if (lnk === null || lnk === undefined) {
      // null to-one relationship — use sentinel so serializer can restore it
      out[name] = NULL_RELATIONSHIP;
      continue;
    }
    if (Array.isArray(lnk)) {
      // empty array stays as empty array; elements are resolved individually
      out[name] = lnk.map((ref) => resolveRef(ref, index, new Set(visited)));
      continue;
    }
    out[name] = resolveRef(lnk, index, new Set(visited));
  }
  return out;
}

// -- public API -------------------------------------------------------------

/**
 * Deserialize a JSON:API document into a plain flat object or array.
 *
 * - Resources in `included` are resolved and inlined.
 * - Relationship references **not** found in `included` become `{ _type, id }`
 *   stubs instead of `null`, preserving all information needed to re-serialize.
 * - Null to-one relationships become `{ _type: null, id: null }` sentinels.
 * - Circular references (e.g. order -> lineItem -> order) are broken safely.
 */
export function deserialize(doc: JsonApiDocument): DeserializeResult | unknown {
  if (!doc?.data) return doc;
  const index = buildIndex(doc.included ?? []);
  if (Array.isArray(doc.data)) {
    return doc.data.map((r) => flattenResource(r, index, new Set()));
  }
  return flattenResource(doc.data, index, new Set());
}
