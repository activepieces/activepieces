/**
 * Document domain errors.
 *
 * @module
 */
import { Schema } from "effect"

/**
 * Teamspace not found in the workspace.
 */
export class TeamspaceNotFoundError extends Schema.TaggedError<TeamspaceNotFoundError>()(
  "TeamspaceNotFoundError",
  {
    identifier: Schema.String
  }
) {
  override get message(): string {
    return `Teamspace '${this.identifier}' not found`
  }
}

/**
 * Document not found in the specified teamspace.
 */
export class DocumentNotFoundError extends Schema.TaggedError<DocumentNotFoundError>()(
  "DocumentNotFoundError",
  {
    identifier: Schema.String,
    teamspace: Schema.String
  }
) {
  override get message(): string {
    return `Document '${this.identifier}' not found in teamspace '${this.teamspace}'`
  }
}

/**
 * Search text not found in document content (edit_document search-and-replace).
 */
export class DocumentTextNotFoundError extends Schema.TaggedError<DocumentTextNotFoundError>()(
  "DocumentTextNotFoundError",
  {
    searchText: Schema.String
  }
) {
  override get message(): string {
    return `String to replace not found in document.\nString: ${this.searchText}`
  }
}

/**
 * Multiple matches of search text in document content (edit_document search-and-replace).
 */
export class DocumentTextMultipleMatchesError extends Schema.TaggedError<DocumentTextMultipleMatchesError>()(
  "DocumentTextMultipleMatchesError",
  {
    searchText: Schema.String,
    matchCount: Schema.Number
  }
) {
  override get message(): string {
    return `Found ${this.matchCount} matches of the string to replace, but replace_all is false. `
      + `To replace all occurrences, set replace_all to true. `
      + `To replace only one occurrence, provide more context to uniquely identify the instance.\n`
      + `String: ${this.searchText}`
  }
}

/**
 * Document has no content to edit (edit_document search-and-replace on empty document).
 */
export class DocumentEmptyContentError extends Schema.TaggedError<DocumentEmptyContentError>()(
  "DocumentEmptyContentError",
  {
    identifier: Schema.String
  }
) {
  override get message(): string {
    return `Document '${this.identifier}' has no content. Use 'content' mode or create_document to set initial content.`
  }
}
