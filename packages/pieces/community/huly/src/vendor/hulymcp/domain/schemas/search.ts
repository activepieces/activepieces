import { JSONSchema, Schema } from "effect"

import { LimitParam, NonEmptyString } from "./shared.js"

export const FulltextSearchParamsSchema = Schema.Struct({
  query: NonEmptyString.annotations({
    description: "Search query string for fulltext search"
  }),
  limit: Schema.optional(
    LimitParam.annotations({
      description: "Maximum number of results to return (default: 50)"
    })
  )
}).annotations({
  title: "FulltextSearchParams",
  description: "Parameters for fulltext search"
})

export type FulltextSearchParams = Schema.Schema.Type<typeof FulltextSearchParamsSchema>

// --- API boundary schemas for Huly SearchResult ---

const SearchResultDocInner = Schema.Struct({
  _id: Schema.String,
  _class: Schema.String,
  createdOn: Schema.optional(Schema.Number)
})

export const SearchResultDocSchema = Schema.Struct({
  id: Schema.String,
  title: Schema.optional(Schema.String),
  description: Schema.optional(Schema.String),
  score: Schema.optional(Schema.Number),
  doc: SearchResultDocInner
})

export type ParsedSearchResultDoc = Schema.Schema.Type<typeof SearchResultDocSchema>

const SearchResultSchema = Schema.Struct({
  docs: Schema.Array(SearchResultDocSchema),
  total: Schema.optional(Schema.Number)
})

export const parseSearchResult = Schema.decodeUnknown(SearchResultSchema)

// --- Output types (internal, post-mapping) ---

export interface SearchResultItem {
  readonly id: string
  readonly class: string
  readonly title?: string | undefined
  readonly description?: string | undefined
  readonly score?: number | undefined
  readonly createdOn?: number | undefined
}

export interface FulltextSearchResult {
  readonly items: ReadonlyArray<SearchResultItem>
  readonly total: number
  readonly query: string
}

export const fulltextSearchParamsJsonSchema = JSONSchema.make(FulltextSearchParamsSchema)

export const parseFulltextSearchParams = Schema.decodeUnknown(FulltextSearchParamsSchema)
