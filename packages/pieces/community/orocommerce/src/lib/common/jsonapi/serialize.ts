import type { FlatResource, JsonApiResource, Linkage, SerializeOptions, SerializeResult } from './types';

// -- internal helpers -------------------------------------------------------

/**
 * Returns true when a value is a plain object that carries a non-null `_type`
 * marker injected by `deserialize()` — i.e. a resolved or stub relationship.
 */
function hasTypeMarker(v: unknown): v is FlatResource {
  return (
    v !== null &&
    typeof v === 'object' &&
    !Array.isArray(v) &&
    typeof (v as FlatResource)['_type'] === 'string'
  );
}

/**
 * Returns true when a value is the null-relationship sentinel emitted by
 * `deserialize()` for JSON:API `{ "data": null }` relationships.
 */
function isNullRelationship(v: unknown): boolean {
  return (
    v !== null &&
    typeof v === 'object' &&
    !Array.isArray(v) &&
    (v as FlatResource)['_type'] === null
  );
}

/** Convert a `_type`-marked flat object back to a JSON:API linkage `{ type, id }`. */
function toLinkage(obj: FlatResource): Linkage {
  return { type: obj['_type'] as string, id: String(obj['id'] ?? '') };
}

/**
 * Returns true when a `_type`-marked object is a *full* inlined resource
 * (has attributes beyond `_type` and `id`) rather than a bare stub.
 *
 * A stub produced by `deserialize()` for a relationship that was NOT included
 * looks like `{ _type: "customers", id: "5" }` — exactly two keys.
 * A full inlined resource has additional attribute / relationship keys.
 */
function isFullResource(v: FlatResource): boolean {
  return Object.keys(v).some((k) => k !== '_type' && k !== 'id');
}

/**
 * Convert a full inlined flat resource into a `JsonApiResource` wire object,
 * recursing so that nested inlined objects are also hoisted into `collected`.
 *
 * De-duplicates by `type + id`: if the same resource has already been added to
 * `collected` it is skipped (prevents duplicates when billingAddress and
 * shippingAddress point to the same record).
 */
function hoistResource(obj: FlatResource, collected: Map<string, JsonApiResource>): Linkage {
  const linkage = toLinkage(obj);
  const key = `${linkage.type}::${linkage.id}`;

  if (!collected.has(key)) {
    // Reserve the slot immediately to break any circular references
    const resource: JsonApiResource = { type: linkage.type, id: linkage.id };
    collected.set(key, resource);

    const attrs: Record<string, unknown> = {};
    const rels: Record<string, { data: Linkage | Linkage[] | null }> = {};

    for (const [k, v] of Object.entries(obj)) {
      if (k === '_type' || k === 'id') continue;

      if (isNullRelationship(v)) {
        rels[k] = { data: null };
      } else if (Array.isArray(v)) {
        rels[k] = {
          data: v.map((item) =>
            hasTypeMarker(item)
              ? isFullResource(item)
                ? hoistResource(item, collected)
                : toLinkage(item)
              : (item as Linkage)
          ),
        };
      } else if (hasTypeMarker(v)) {
        rels[k] = {
          data: isFullResource(v) ? hoistResource(v, collected) : toLinkage(v),
        };
      } else if (v !== null && typeof v === 'object') {
        // plain object without _type — treat as attribute
        attrs[k] = v;
      } else {
        attrs[k] = v;
      }
    }

    if (Object.keys(attrs).length > 0) resource.attributes = attrs;
    if (Object.keys(rels).length > 0) resource.relationships = rels;
  }

  return linkage;
}

/**
 * Split a flat (deserialized) object into JSON:API `attributes`,
 * auto-detected `relationships`, and `autoIncluded` resources.
 *
 * Rules (applied after skipping `_type` and `id`):
 *  - Scalar (string | number | boolean | null) -> `attributes`.
 *  - `{ _type: null }` sentinel -> relationship `{ data: null }`.
 *  - Plain object with `_type` and **only** `_type`+`id` keys (stub)
 *    -> to-one relationship linkage, nothing added to included.
 *  - Plain object with `_type` and **extra** fields (full inlined resource)
 *    -> to-one relationship linkage **+** object hoisted into `autoIncluded`.
 *  - Array -> to-many relationship; each element follows the same stub/full rule.
 */
function splitFlat(flat: FlatResource): {
  attributes: FlatResource;
  relationships: Record<string, { data: unknown }>;
  autoIncluded: JsonApiResource[];
} {
  const attributes: FlatResource = {};
  const relationships: Record<string, { data: unknown }> = {};
  const collected = new Map<string, JsonApiResource>();

  for (const [key, value] of Object.entries(flat)) {
    if (key === '_type' || key === 'id') continue;

    // null-relationship sentinel
    if (isNullRelationship(value)) {
      relationships[key] = { data: null };
      continue;
    }

    // any array -> to-many relationship
    if (Array.isArray(value)) {
      relationships[key] = {
        data: value.map((item) => {
          if (!hasTypeMarker(item)) return item;
          return isFullResource(item) ? hoistResource(item, collected) : toLinkage(item);
        }),
      };
      continue;
    }

    // any plain object with _type -> to-one relationship
    if (hasTypeMarker(value)) {
      relationships[key] = {
        data: isFullResource(value) ? hoistResource(value, collected) : toLinkage(value),
      };
      continue;
    }

    // plain object without _type -> to-one relationship, passed as-is
    if (value !== null && typeof value === 'object') {
      relationships[key] = { data: value };
      continue;
    }

    // scalar (string, number, boolean, null) -> attribute
    attributes[key] = value;
  }

  return { attributes, relationships, autoIncluded: Array.from(collected.values()) };
}

// -- public API -------------------------------------------------------------

/**
 * Serialize a flat object into a JSON:API-compliant document.
 *
 * - Scalar fields -> `attributes`; arrays and objects -> `relationships`.
 * - Null-relationship sentinels (`{ _type: null }`) -> `{ data: null }`.
 * - Explicit `relationships` in options take priority over auto-detected ones.
 * - `id` is read from options first, then from the flat object's own `id` field.
 * - If `included` resources are provided they are forwarded into the document.
 */
export function serialize(options: SerializeOptions): SerializeResult {
  const { type, id, data: flat, relationships: explicitRels = {}, included } = options;

  const { attributes, relationships: detectedRels, autoIncluded } = splitFlat(flat);

  // Explicit relationships override auto-detected ones
  const mergedRels: Record<string, { data: unknown }> = { ...detectedRels };
  for (const [name, linkage] of Object.entries(explicitRels)) {
    mergedRels[name] = { data: linkage };
  }

  // id: explicit option wins over id embedded in the flat object
  const idFromFlat =
    flat['id'] != null && String(flat['id']).trim() !== ''
      ? String(flat['id']).trim()
      : undefined;
  const resolvedId = (id && id.trim() !== '' ? id.trim() : undefined) ?? idFromFlat;

  const dataBlock: Record<string, unknown> = { type, attributes };
  if (resolvedId) dataBlock['id'] = resolvedId;
  if (Object.keys(mergedRels).length > 0) dataBlock['relationships'] = mergedRels;

  const result: SerializeResult = { data: dataBlock };

  // Merge auto-hoisted resources with explicitly provided included.
  // Explicit entries win over auto-hoisted ones with the same type+id.
  const explicitIncluded = included ?? [];
  const explicitKeys = new Set(explicitIncluded.map((r) => `${r.type}::${r.id}`));
  const mergedIncluded = [
    ...autoIncluded.filter((r) => !explicitKeys.has(`${r.type}::${r.id}`)),
    ...explicitIncluded,
  ];
  if (mergedIncluded.length > 0) result.included = mergedIncluded;

  return result;
}
