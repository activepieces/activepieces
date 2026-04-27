/**
 * Edit document operation for Huly MCP server.
 *
 * NOT SDK PARITY — see EditDocumentParamsSchema in domain/schemas/documents.ts
 * for the full design rationale.
 *
 * @module
 */
import type { DocumentUpdate } from "@hcengineering/core"
import type { Document as HulyDocument } from "@hcengineering/document"
import { Effect } from "effect"

import type { EditDocumentParams } from "../../domain/schemas.js"
import type { EditDocumentResult } from "../../domain/schemas/documents.js"
import { DocumentId } from "../../domain/schemas/shared.js"
import type { HulyClient, HulyClientError } from "../client.js"
import {
  DocumentEmptyContentError,
  type DocumentNotFoundError,
  DocumentTextMultipleMatchesError,
  DocumentTextNotFoundError,
  type TeamspaceNotFoundError
} from "../errors.js"
import { findTeamspaceAndDocument } from "./documents.js"

import { documentPlugin } from "../huly-plugins.js"

type EditDocumentError =
  | HulyClientError
  | TeamspaceNotFoundError
  | DocumentNotFoundError
  | DocumentTextNotFoundError
  | DocumentTextMultipleMatchesError
  | DocumentEmptyContentError

export const editDocument = (
  params: EditDocumentParams
): Effect.Effect<EditDocumentResult, EditDocumentError, HulyClient> =>
  Effect.gen(function*() {
    const { client, doc, teamspace } = yield* findTeamspaceAndDocument(params)

    const updateOps: DocumentUpdate<HulyDocument> = {}
    let contentUpdatedInPlace = false

    if (params.title !== undefined) {
      updateOps.title = params.title
    }

    // Mode 1: Full content replace
    if (params.content !== undefined) {
      if (params.content.trim() === "") {
        updateOps.content = null
      } else if (doc.content) {
        yield* client.updateMarkup(
          documentPlugin.class.Document,
          doc._id,
          "content",
          params.content,
          "markdown"
        )
        contentUpdatedInPlace = true
      } else {
        const contentMarkupRef = yield* client.uploadMarkup(
          documentPlugin.class.Document,
          doc._id,
          "content",
          params.content,
          "markdown"
        )
        updateOps.content = contentMarkupRef
      }
    }

    // Mode 2: Search-and-replace
    if (params.old_text !== undefined && params.new_text !== undefined) {
      if (!doc.content) {
        return yield* new DocumentEmptyContentError({ identifier: params.document })
      }

      const currentContent: string = yield* client.fetchMarkup(
        doc._class,
        doc._id,
        "content",
        doc.content,
        "markdown"
      )

      const occurrences = countOccurrences(currentContent, params.old_text)

      if (occurrences === 0) {
        return yield* new DocumentTextNotFoundError({ searchText: params.old_text })
      }

      if (occurrences > 1 && !params.replace_all) {
        return yield* new DocumentTextMultipleMatchesError({
          searchText: params.old_text,
          matchCount: occurrences
        })
      }

      // Use indexOf+slice for single replace to avoid $& replacement-pattern
      // injection in String.prototype.replace. split/join is safe for replace_all.
      const idx = currentContent.indexOf(params.old_text)
      const newContent = params.replace_all
        ? currentContent.split(params.old_text).join(params.new_text)
        : currentContent.substring(0, idx) + params.new_text + currentContent.substring(idx + params.old_text.length)

      yield* client.updateMarkup(
        documentPlugin.class.Document,
        doc._id,
        "content",
        newContent,
        "markdown"
      )
      contentUpdatedInPlace = true
    }

    if (Object.keys(updateOps).length === 0 && !contentUpdatedInPlace) {
      return { id: DocumentId.make(doc._id), updated: false }
    }

    if (Object.keys(updateOps).length > 0) {
      yield* client.updateDoc(
        documentPlugin.class.Document,
        teamspace._id,
        doc._id,
        updateOps
      )
    }

    return { id: DocumentId.make(doc._id), updated: true }
  })

const countOccurrences = (text: string, search: string): number => {
  let count = 0
  let pos = text.indexOf(search)
  while (pos !== -1) {
    count++
    pos = text.indexOf(search, pos + search.length)
  }
  return count
}
