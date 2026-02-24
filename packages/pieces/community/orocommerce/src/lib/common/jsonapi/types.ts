// -- JSON:API wire types ----------------------------------------------------

export type Linkage = { type: string; id: string };

export interface JsonApiResource {
  type: string;
  id: string;
  attributes?: Record<string, unknown>;
  relationships?: Record<string, { data: Linkage | Linkage[] | null }>;
}

export interface JsonApiDocument {
  data?: JsonApiResource | JsonApiResource[];
  included?: JsonApiResource[];
}

// -- Simplified / flat output types ----------------------------------------

/**
 * A plain object produced by deserializing a JSON:API resource.
 *
 * Every field that represents a relationship carries a `_type` string marker
 * (the JSON:API resource type of the related entity) so the document can be
 * re-serialized back to JSON:API format without data loss.
 */
export type FlatResource = Record<string, unknown>;

/** Result returned by `deserialize()` — a single flat object or an array. */
export type DeserializeResult = FlatResource | FlatResource[];

// -- Serialize input / output types ----------------------------------------

export interface SerializeOptions {
  /** JSON:API resource type (e.g. "orders"). */
  type: string;
  /**
   * Resource id — omit for POST (create).
   * When provided it overrides an `id` field present in `data`.
   */
  id?: string;
  /**
   * Flat data object to serialize.
   *
   * Classification rules (applied after skipping `_type` and `id`):
   *  - Scalar (string | number | boolean | null) → `attributes`.
   *  - Any plain object → to-one `relationship`.
   *    Objects with `_type: null` (null-relationship sentinel) → `{ data: null }`.
   *    Objects with `_type` and **only** `_type`+`id` keys (stub) → linkage only.
   *    Objects with `_type` and **extra** fields (full inlined resource)
   *      → linkage in `relationships` **and** object hoisted into `included`.
   *  - Any array → to-many `relationship`; each element follows the same rules.
   */
  data: FlatResource;
  /**
   * Explicit relationship map that takes priority over auto-detected ones.
   * Each value is a single linkage `{ type, id }`, an array of linkages, or
   * `null` to explicitly clear a to-one relationship.
   */
  relationships?: Record<string, Linkage | Linkage[] | null>;
  /**
   * Optional array of full JSON:API resource objects to embed as `included`.
   * Use this to create or update related resources in a single request.
   */
  included?: JsonApiResource[];
}

/** Document returned by `serialize()`. */
export interface SerializeResult {
  data: Record<string, unknown>;
  included?: JsonApiResource[];
}
