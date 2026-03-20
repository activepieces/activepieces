import { JSONSchema, Schema } from "effect"

import type { DocumentId, TeamspaceId } from "./shared.js"
import { DocumentIdentifier, LimitParam, NonEmptyString, TeamspaceIdentifier } from "./shared.js"

// No codec needed — internal type, not used for runtime validation
export interface TeamspaceSummary {
  readonly id: TeamspaceId
  readonly name: string
  readonly description?: string | undefined
  readonly archived: boolean
  readonly private: boolean
}

export const ListTeamspacesParamsSchema = Schema.Struct({
  includeArchived: Schema.optional(Schema.Boolean.annotations({
    description: "Include archived teamspaces in results (default: false, showing only active)"
  })),
  limit: Schema.optional(
    LimitParam.annotations({
      description: "Maximum number of teamspaces to return (default: 50)"
    })
  )
}).annotations({
  title: "ListTeamspacesParams",
  description: "Parameters for listing teamspaces"
})

export type ListTeamspacesParams = Schema.Schema.Type<typeof ListTeamspacesParamsSchema>

export interface ListTeamspacesResult {
  readonly teamspaces: ReadonlyArray<TeamspaceSummary>
  readonly total: number
}

export interface DocumentSummary {
  readonly id: DocumentId
  readonly title: string
  readonly teamspace: string
  readonly modifiedOn?: number | undefined
}

const ListDocumentsParamsBase = Schema.Struct({
  teamspace: TeamspaceIdentifier.annotations({
    description: "Teamspace name or ID"
  }),
  titleSearch: Schema.optional(Schema.String.annotations({
    description: "Search documents by title substring (case-insensitive). Mutually exclusive with titleRegex."
  })),
  titleRegex: Schema.optional(Schema.String.annotations({
    description:
      "Filter documents by title using a regex pattern (e.g., '^RFC'). Mutually exclusive with titleSearch. Note: regex support depends on the Huly backend; use titleSearch for broader compatibility."
  })),
  contentSearch: Schema.optional(Schema.String.annotations({
    description: "Search documents by content (fulltext search)"
  })),
  limit: Schema.optional(
    LimitParam.annotations({
      description: "Maximum number of documents to return (default: 50)"
    })
  )
})

export const ListDocumentsParamsSchema = ListDocumentsParamsBase.pipe(
  Schema.filter((params) => {
    if (params.titleSearch !== undefined && params.titleRegex !== undefined) {
      return "Cannot provide both 'titleSearch' and 'titleRegex'. Use one or the other."
    }
    return undefined
  })
).annotations({
  title: "ListDocumentsParams",
  description: "Parameters for listing documents in a teamspace"
})

export type ListDocumentsParams = Schema.Schema.Type<typeof ListDocumentsParamsSchema>

export interface ListDocumentsResult {
  readonly documents: ReadonlyArray<DocumentSummary>
  readonly total: number
}

export interface Document {
  readonly id: DocumentId
  readonly title: string
  readonly content?: string | undefined
  readonly teamspace: string
  readonly modifiedOn?: number | undefined
  readonly createdOn?: number | undefined
}

export const GetDocumentParamsSchema = Schema.Struct({
  teamspace: TeamspaceIdentifier.annotations({
    description: "Teamspace name or ID"
  }),
  document: DocumentIdentifier.annotations({
    description: "Document title or ID"
  })
}).annotations({
  title: "GetDocumentParams",
  description: "Parameters for getting a single document"
})

export type GetDocumentParams = Schema.Schema.Type<typeof GetDocumentParamsSchema>

export const CreateDocumentParamsSchema = Schema.Struct({
  teamspace: TeamspaceIdentifier.annotations({
    description: "Teamspace name or ID"
  }),
  title: NonEmptyString.annotations({
    description: "Document title"
  }),
  content: Schema.optional(Schema.String.annotations({
    description: "Document content (markdown supported)"
  }))
}).annotations({
  title: "CreateDocumentParams",
  description: "Parameters for creating a document"
})

export type CreateDocumentParams = Schema.Schema.Type<typeof CreateDocumentParamsSchema>

/**
 * Edit document parameters — supports two mutually exclusive content modes:
 *
 * 1. Full replace: provide `content` to overwrite the entire document body.
 * 2. Search-and-replace: provide `old_text` + `new_text` to perform a targeted edit.
 *
 * NOT SDK PARITY — Intentional design divergence.
 *
 * The Huly SDK only supports whole-document read (getMarkup) and whole-document
 * write (updateMarkup). There is no partial/patch API.
 *
 * The search-and-replace mode (old_text/new_text) is inspired by Claude Code's
 * Edit tool, to avoid forcing the calling agent to send full document content on
 * every edit. The server performs read-modify-write internally using SDK primitives.
 *
 * The old_text/new_text contract mirrors Claude Code's Edit tool:
 * - old_text must match exactly (no regex)
 * - Multiple matches error unless replace_all is set
 * - Empty new_text deletes the matched text
 * - Empty old_text is an error (use create_document for new content)
 *
 * Agents familiar with Claude Code's Edit tool can use the same mental model.
 */
const EditDocumentParamsBase = Schema.Struct({
  teamspace: TeamspaceIdentifier.annotations({
    description: "Teamspace name or ID"
  }),
  document: DocumentIdentifier.annotations({
    description: "Document title or ID"
  }),
  title: Schema.optional(NonEmptyString.annotations({
    description: "New document title"
  })),
  content: Schema.optional(Schema.String.annotations({
    description: "Full replacement content (markdown). Mutually exclusive with old_text/new_text."
  })),
  old_text: Schema.optional(Schema.String.annotations({
    description: "Exact text to find in the document. Must be non-empty. Mutually exclusive with content."
  })),
  new_text: Schema.optional(Schema.String.annotations({
    description: "Replacement text. Empty string deletes the matched text. Required when old_text is provided."
  })),
  replace_all: Schema.optional(Schema.Boolean.annotations({
    description: "Replace all occurrences of old_text (default: false). Only used with old_text/new_text."
  }))
})

export const EditDocumentParamsSchema = EditDocumentParamsBase.pipe(
  Schema.filter((params) => {
    const hasContent = params.content !== undefined
    const hasOldText = params.old_text !== undefined
    const hasNewText = params.new_text !== undefined

    if (hasContent && (hasOldText || hasNewText)) {
      return "Cannot provide both 'content' (full replace) and 'old_text'/'new_text' (search-and-replace). Use one mode or the other."
    }

    if (hasOldText !== hasNewText) {
      return "Both 'old_text' and 'new_text' must be provided together for search-and-replace mode."
    }

    if (hasOldText && params.old_text.trim() === "") {
      return "old_text must be non-empty. To create a new document, use create_document."
    }

    return undefined
  })
).annotations({
  title: "EditDocumentParams",
  description:
    "Edit a document. Two content modes (mutually exclusive): (1) 'content' for full replace, (2) 'old_text' + 'new_text' for targeted search-and-replace. Also supports renaming via 'title'."
})

export type EditDocumentParams = Schema.Schema.Type<typeof EditDocumentParamsSchema>

export const DeleteDocumentParamsSchema = Schema.Struct({
  teamspace: TeamspaceIdentifier.annotations({
    description: "Teamspace name or ID"
  }),
  document: DocumentIdentifier.annotations({
    description: "Document title or ID"
  })
}).annotations({
  title: "DeleteDocumentParams",
  description: "Parameters for deleting a document"
})

export type DeleteDocumentParams = Schema.Schema.Type<typeof DeleteDocumentParamsSchema>

// --- Teamspace CRUD Schemas ---

export const GetTeamspaceParamsSchema = Schema.Struct({
  teamspace: TeamspaceIdentifier.annotations({
    description: "Teamspace name or ID"
  })
}).annotations({
  title: "GetTeamspaceParams",
  description: "Parameters for getting a single teamspace"
})

export type GetTeamspaceParams = Schema.Schema.Type<typeof GetTeamspaceParamsSchema>

export const CreateTeamspaceParamsSchema = Schema.Struct({
  name: NonEmptyString.annotations({
    description: "Teamspace name"
  }),
  description: Schema.optional(Schema.String.annotations({
    description: "Teamspace description"
  })),
  private: Schema.optional(Schema.Boolean.annotations({
    description: "Whether the teamspace is private (default: false)"
  }))
}).annotations({
  title: "CreateTeamspaceParams",
  description: "Parameters for creating a teamspace"
})

export type CreateTeamspaceParams = Schema.Schema.Type<typeof CreateTeamspaceParamsSchema>

export const UpdateTeamspaceParamsSchema = Schema.Struct({
  teamspace: TeamspaceIdentifier.annotations({
    description: "Teamspace name or ID"
  }),
  name: Schema.optional(NonEmptyString.annotations({
    description: "New teamspace name"
  })),
  description: Schema.optional(
    Schema.NullOr(Schema.String).annotations({ description: "New description (null to clear)" })
  ),
  archived: Schema.optional(Schema.Boolean.annotations({
    description: "Set archived status"
  }))
}).annotations({
  title: "UpdateTeamspaceParams",
  description: "Parameters for updating a teamspace"
})

export type UpdateTeamspaceParams = Schema.Schema.Type<typeof UpdateTeamspaceParamsSchema>

export const DeleteTeamspaceParamsSchema = Schema.Struct({
  teamspace: TeamspaceIdentifier.annotations({
    description: "Teamspace name or ID"
  })
}).annotations({
  title: "DeleteTeamspaceParams",
  description: "Parameters for deleting a teamspace"
})

export type DeleteTeamspaceParams = Schema.Schema.Type<typeof DeleteTeamspaceParamsSchema>

export interface GetTeamspaceResult extends TeamspaceSummary {
  readonly documents: number
}

export interface CreateTeamspaceResult {
  readonly id: TeamspaceId
  readonly name: string
  readonly created: boolean
}

export interface UpdateTeamspaceResult {
  readonly id: TeamspaceId
  readonly updated: boolean
}

export interface DeleteTeamspaceResult {
  readonly id: TeamspaceId
  readonly deleted: boolean
}

// --- JSON Schemas & Parsers ---

export const listTeamspacesParamsJsonSchema = JSONSchema.make(ListTeamspacesParamsSchema)
export const getTeamspaceParamsJsonSchema = JSONSchema.make(GetTeamspaceParamsSchema)
export const createTeamspaceParamsJsonSchema = JSONSchema.make(CreateTeamspaceParamsSchema)
export const updateTeamspaceParamsJsonSchema = JSONSchema.make(UpdateTeamspaceParamsSchema)
export const deleteTeamspaceParamsJsonSchema = JSONSchema.make(DeleteTeamspaceParamsSchema)
export const listDocumentsParamsJsonSchema = JSONSchema.make(ListDocumentsParamsSchema)
export const getDocumentParamsJsonSchema = JSONSchema.make(GetDocumentParamsSchema)
export const createDocumentParamsJsonSchema = JSONSchema.make(CreateDocumentParamsSchema)
export const editDocumentParamsJsonSchema = JSONSchema.make(EditDocumentParamsSchema)
export const deleteDocumentParamsJsonSchema = JSONSchema.make(DeleteDocumentParamsSchema)

export const parseListTeamspacesParams = Schema.decodeUnknown(ListTeamspacesParamsSchema)
export const parseGetTeamspaceParams = Schema.decodeUnknown(GetTeamspaceParamsSchema)
export const parseCreateTeamspaceParams = Schema.decodeUnknown(CreateTeamspaceParamsSchema)
export const parseUpdateTeamspaceParams = Schema.decodeUnknown(UpdateTeamspaceParamsSchema)
export const parseDeleteTeamspaceParams = Schema.decodeUnknown(DeleteTeamspaceParamsSchema)
export const parseListDocumentsParams = Schema.decodeUnknown(ListDocumentsParamsSchema)
export const parseGetDocumentParams = Schema.decodeUnknown(GetDocumentParamsSchema)
export const parseCreateDocumentParams = Schema.decodeUnknown(CreateDocumentParamsSchema)
export const parseEditDocumentParams = Schema.decodeUnknown(EditDocumentParamsSchema)
export const parseDeleteDocumentParams = Schema.decodeUnknown(DeleteDocumentParamsSchema)

// No codec needed — internal type, not used for runtime validation
export interface CreateDocumentResult {
  readonly id: DocumentId
  readonly title: string
}

export interface EditDocumentResult {
  readonly id: DocumentId
  readonly updated: boolean
}

export interface DeleteDocumentResult {
  readonly id: DocumentId
  readonly deleted: boolean
}
