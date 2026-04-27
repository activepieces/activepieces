/**
 * Label/tag domain errors.
 *
 * @module
 */
import { Schema } from "effect"

export class TagNotFoundError extends Schema.TaggedError<TagNotFoundError>()(
  "TagNotFoundError",
  {
    identifier: Schema.String
  }
) {
  override get message(): string {
    return `Tag/label '${this.identifier}' not found`
  }
}

export class TagCategoryNotFoundError extends Schema.TaggedError<TagCategoryNotFoundError>()(
  "TagCategoryNotFoundError",
  {
    identifier: Schema.String
  }
) {
  override get message(): string {
    return `Tag category '${this.identifier}' not found`
  }
}
