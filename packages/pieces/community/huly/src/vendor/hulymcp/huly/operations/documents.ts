/**
 * Document domain operations for Huly MCP server.
 *
 * @module
 */
import {
  type Data,
  type DocumentQuery,
  type DocumentUpdate,
  generateId,
  type MarkupBlobRef,
  type Ref,
  SortingOrder
} from "@hcengineering/core"
import type { Document as HulyDocument, Teamspace as HulyTeamspace } from "@hcengineering/document"
import { makeRank } from "@hcengineering/rank"
import { Effect } from "effect"

import type {
  CreateDocumentParams,
  CreateTeamspaceParams,
  DeleteDocumentParams,
  DeleteTeamspaceParams,
  Document,
  DocumentSummary,
  GetDocumentParams,
  GetTeamspaceParams,
  ListDocumentsParams,
  ListDocumentsResult,
  ListTeamspacesParams,
  ListTeamspacesResult,
  TeamspaceSummary,
  UpdateTeamspaceParams
} from "../../domain/schemas.js"
import type {
  CreateDocumentResult,
  CreateTeamspaceResult,
  DeleteDocumentResult,
  DeleteTeamspaceResult,
  GetTeamspaceResult,
  UpdateTeamspaceResult
} from "../../domain/schemas/documents.js"
import { DocumentId, TeamspaceId } from "../../domain/schemas/shared.js"
import { HulyClient, type HulyClientError } from "../client.js"
import { DocumentNotFoundError, TeamspaceNotFoundError } from "../errors.js"
import { escapeLikeWildcards } from "./query-helpers.js"
import { clampLimit, findByNameOrId, toRef } from "./shared.js"

import { core, documentPlugin } from "../huly-plugins.js"

export { editDocument } from "./documents-edit.js"

type ListTeamspacesError = HulyClientError

type GetTeamspaceError =
  | HulyClientError
  | TeamspaceNotFoundError

type CreateTeamspaceError = HulyClientError

type UpdateTeamspaceError =
  | HulyClientError
  | TeamspaceNotFoundError

type DeleteTeamspaceError =
  | HulyClientError
  | TeamspaceNotFoundError

type ListDocumentsError =
  | HulyClientError
  | TeamspaceNotFoundError

type GetDocumentError =
  | HulyClientError
  | TeamspaceNotFoundError
  | DocumentNotFoundError

type CreateDocumentError =
  | HulyClientError
  | TeamspaceNotFoundError

type DeleteDocumentError =
  | HulyClientError
  | TeamspaceNotFoundError
  | DocumentNotFoundError

// --- Helpers ---

/**
 * Find a teamspace by name or ID.
 * By default only finds non-archived teamspaces. Pass includeArchived to find any.
 */
const findTeamspace = (
  identifier: string,
  opts?: { includeArchived?: boolean }
): Effect.Effect<
  { client: HulyClient["Type"]; teamspace: HulyTeamspace },
  TeamspaceNotFoundError | HulyClientError,
  HulyClient
> =>
  Effect.gen(function*() {
    const client = yield* HulyClient

    const nameQuery: DocumentQuery<HulyTeamspace> = { name: identifier }
    const idQuery: DocumentQuery<HulyTeamspace> = { _id: toRef<HulyTeamspace>(identifier) }
    if (!opts?.includeArchived) {
      nameQuery.archived = false
      idQuery.archived = false
    }

    const teamspace = yield* findByNameOrId(
      client,
      documentPlugin.class.Teamspace,
      nameQuery,
      idQuery
    )

    if (teamspace === undefined) {
      return yield* new TeamspaceNotFoundError({ identifier })
    }

    return { client, teamspace }
  })

/**
 * Find a teamspace and document.
 */
export const findTeamspaceAndDocument = (
  params: { teamspace: string; document: string }
): Effect.Effect<
  { client: HulyClient["Type"]; teamspace: HulyTeamspace; doc: HulyDocument },
  TeamspaceNotFoundError | DocumentNotFoundError | HulyClientError,
  HulyClient
> =>
  Effect.gen(function*() {
    const { client, teamspace } = yield* findTeamspace(params.teamspace)

    const doc = yield* findByNameOrId(
      client,
      documentPlugin.class.Document,
      { space: teamspace._id, title: params.document },
      { space: teamspace._id, _id: toRef<HulyDocument>(params.document) }
    )

    if (doc === undefined) {
      return yield* new DocumentNotFoundError({
        identifier: params.document,
        teamspace: params.teamspace
      })
    }

    return { client, teamspace, doc }
  })

// --- Operations ---

/**
 * List teamspaces.
 * Results sorted by name ascending.
 */
export const listTeamspaces = (
  params: ListTeamspacesParams
): Effect.Effect<ListTeamspacesResult, ListTeamspacesError, HulyClient> =>
  Effect.gen(function*() {
    const client = yield* HulyClient

    const query: DocumentQuery<HulyTeamspace> = {}
    if (!params.includeArchived) {
      query.archived = false
    }

    const limit = clampLimit(params.limit)

    const teamspaces = yield* client.findAll<HulyTeamspace>(
      documentPlugin.class.Teamspace,
      query,
      {
        limit,
        sort: {
          name: SortingOrder.Ascending
        }
      }
    )

    const total = teamspaces.total

    const summaries: Array<TeamspaceSummary> = teamspaces.map((ts) => ({
      id: TeamspaceId.make(ts._id),
      name: ts.name,
      description: ts.description || undefined,
      archived: ts.archived,
      private: ts.private
    }))

    return {
      teamspaces: summaries,
      total
    }
  })

// --- Teamspace CRUD Operations ---

export const getTeamspace = (
  params: GetTeamspaceParams
): Effect.Effect<GetTeamspaceResult, GetTeamspaceError, HulyClient> =>
  Effect.gen(function*() {
    const { client, teamspace } = yield* findTeamspace(params.teamspace, { includeArchived: true })

    const docs = yield* client.findAll<HulyDocument>(
      documentPlugin.class.Document,
      { space: teamspace._id },
      { limit: 1, total: true }
    )

    return {
      id: TeamspaceId.make(teamspace._id),
      name: teamspace.name,
      description: teamspace.description || undefined,
      archived: teamspace.archived,
      private: teamspace.private,
      documents: docs.total
    }
  })

export const createTeamspace = (
  params: CreateTeamspaceParams
): Effect.Effect<CreateTeamspaceResult, CreateTeamspaceError, HulyClient> =>
  Effect.gen(function*() {
    const client = yield* HulyClient

    const existing = yield* client.findOne<HulyTeamspace>(
      documentPlugin.class.Teamspace,
      { name: params.name, archived: false }
    )

    if (existing !== undefined) {
      return {
        id: TeamspaceId.make(existing._id),
        name: existing.name,
        created: false
      }
    }

    const teamspaceId: Ref<HulyTeamspace> = generateId()

    const teamspaceData: Data<HulyTeamspace> = {
      name: params.name,
      description: params.description ?? "",
      private: params.private ?? false,
      archived: false,
      members: [client.getAccountUuid()],
      owners: [client.getAccountUuid()],
      icon: documentPlugin.icon.Teamspace,
      type: documentPlugin.spaceType.DefaultTeamspaceType
    }

    // Teamspaces are top-level spaces — use core.space.Space as parent,
    // matching the official Huly platform-api example (teamspace-create.ts).
    yield* client.createDoc(
      documentPlugin.class.Teamspace,
      core.space.Space,
      teamspaceData,
      teamspaceId
    )

    return {
      id: TeamspaceId.make(teamspaceId),
      name: params.name,
      created: true
    }
  })

export const updateTeamspace = (
  params: UpdateTeamspaceParams
): Effect.Effect<UpdateTeamspaceResult, UpdateTeamspaceError, HulyClient> =>
  Effect.gen(function*() {
    const { client, teamspace } = yield* findTeamspace(params.teamspace, { includeArchived: true })

    const updateOps: DocumentUpdate<HulyTeamspace> = {}

    if (params.name !== undefined) {
      updateOps.name = params.name
    }

    if (params.description !== undefined) {
      updateOps.description = params.description === null ? "" : params.description
    }

    if (params.archived !== undefined) {
      updateOps.archived = params.archived
    }

    if (Object.keys(updateOps).length === 0) {
      return { id: TeamspaceId.make(teamspace._id), updated: false }
    }

    yield* client.updateDoc(
      documentPlugin.class.Teamspace,
      core.space.Space,
      teamspace._id,
      updateOps
    )

    return { id: TeamspaceId.make(teamspace._id), updated: true }
  })

export const deleteTeamspace = (
  params: DeleteTeamspaceParams
): Effect.Effect<DeleteTeamspaceResult, DeleteTeamspaceError, HulyClient> =>
  Effect.gen(function*() {
    const { client, teamspace } = yield* findTeamspace(params.teamspace, { includeArchived: true })

    yield* client.removeDoc(
      documentPlugin.class.Teamspace,
      core.space.Space,
      teamspace._id
    )

    return { id: TeamspaceId.make(teamspace._id), deleted: true }
  })

/**
 * List documents in a teamspace.
 * Results sorted by modification date descending.
 * Supports filtering by title substring and content fulltext search.
 */
export const listDocuments = (
  params: ListDocumentsParams
): Effect.Effect<ListDocumentsResult, ListDocumentsError, HulyClient> =>
  Effect.gen(function*() {
    const { client, teamspace } = yield* findTeamspace(params.teamspace)

    const limit = clampLimit(params.limit)

    const query: DocumentQuery<HulyDocument> = {
      space: teamspace._id
    }

    if (params.titleSearch !== undefined && params.titleSearch.trim() !== "") {
      query.title = { $like: `%${escapeLikeWildcards(params.titleSearch)}%` }
    }

    if (params.titleRegex !== undefined && params.titleRegex.trim() !== "") {
      query.title = { $regex: params.titleRegex }
    }

    if (params.contentSearch !== undefined && params.contentSearch.trim() !== "") {
      query.$search = params.contentSearch
    }

    const documents = yield* client.findAll<HulyDocument>(
      documentPlugin.class.Document,
      query,
      {
        limit,
        sort: {
          modifiedOn: SortingOrder.Descending
        }
      }
    )

    const total = documents.total

    const summaries: Array<DocumentSummary> = documents.map((doc) => ({
      id: DocumentId.make(doc._id),
      title: doc.title,
      teamspace: teamspace.name,
      modifiedOn: doc.modifiedOn
    }))

    return {
      documents: summaries,
      total
    }
  })

/**
 * Get a single document with full content.
 *
 * Looks up document by title or ID within the specified teamspace.
 * Returns full document including:
 * - Content rendered as markdown
 * - All metadata
 */
export const getDocument = (
  params: GetDocumentParams
): Effect.Effect<Document, GetDocumentError, HulyClient> =>
  Effect.gen(function*() {
    const { client, doc, teamspace } = yield* findTeamspaceAndDocument({
      teamspace: params.teamspace,
      document: params.document
    })

    const content: string | undefined = doc.content
      ? yield* client.fetchMarkup(
        doc._class,
        doc._id,
        "content",
        doc.content,
        "markdown"
      )
      : undefined

    const result: Document = {
      id: DocumentId.make(doc._id),
      title: doc.title,
      content,
      teamspace: teamspace.name,
      modifiedOn: doc.modifiedOn,
      createdOn: doc.createdOn
    }

    return result
  })

// --- Create Document Operation ---

/**
 * Create a new document in a teamspace.
 *
 * Creates document with:
 * - Title (required)
 * - Content (optional, markdown supported)
 *
 * @param params - Create document parameters
 * @returns Created document id and title
 * @throws TeamspaceNotFoundError if teamspace doesn't exist
 */
export const createDocument = (
  params: CreateDocumentParams
): Effect.Effect<CreateDocumentResult, CreateDocumentError, HulyClient> =>
  Effect.gen(function*() {
    const { client, teamspace } = yield* findTeamspace(params.teamspace)

    const documentId: Ref<HulyDocument> = generateId()

    // Fetch rank of the last document to insert after
    const lastDoc = yield* client.findOne<HulyDocument>(
      documentPlugin.class.Document,
      { space: teamspace._id },
      { sort: { rank: SortingOrder.Descending } }
    )
    const rank = makeRank(lastDoc?.rank, undefined)

    const contentMarkupRef: MarkupBlobRef | null = params.content !== undefined && params.content.trim() !== ""
      ? yield* client.uploadMarkup(
        documentPlugin.class.Document,
        documentId,
        "content",
        params.content,
        "markdown"
      )
      : null

    const documentData: Data<HulyDocument> = {
      title: params.title,
      content: contentMarkupRef,
      parent: documentPlugin.ids.NoParent,
      rank
    }

    yield* client.createDoc(
      documentPlugin.class.Document,
      teamspace._id,
      documentData,
      documentId
    )

    return { id: DocumentId.make(documentId), title: params.title }
  })

// --- Delete Document Operation ---

/**
 * Delete a document from a teamspace.
 *
 * Permanently removes the document. This operation cannot be undone.
 *
 * @param params - Delete document parameters
 * @returns Deleted document id and success flag
 * @throws TeamspaceNotFoundError if teamspace doesn't exist
 * @throws DocumentNotFoundError if document doesn't exist
 */
export const deleteDocument = (
  params: DeleteDocumentParams
): Effect.Effect<DeleteDocumentResult, DeleteDocumentError, HulyClient> =>
  Effect.gen(function*() {
    const { client, doc, teamspace } = yield* findTeamspaceAndDocument(params)

    yield* client.removeDoc(
      documentPlugin.class.Document,
      teamspace._id,
      doc._id
    )

    return { id: DocumentId.make(doc._id), deleted: true }
  })
