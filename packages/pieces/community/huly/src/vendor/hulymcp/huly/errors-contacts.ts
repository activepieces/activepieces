/**
 * Contact domain errors.
 *
 * @module
 */
import { Schema } from "effect"

/**
 * Person (assignee) not found.
 */
export class PersonNotFoundError extends Schema.TaggedError<PersonNotFoundError>()(
  "PersonNotFoundError",
  {
    identifier: Schema.String
  }
) {
  override get message(): string {
    return `Person '${this.identifier}' not found`
  }
}

/**
 * Invalid PersonUuid format.
 */
export class InvalidPersonUuidError extends Schema.TaggedError<InvalidPersonUuidError>()(
  "InvalidPersonUuidError",
  {
    uuid: Schema.String
  }
) {
  override get message(): string {
    return `Invalid PersonUuid format: '${this.uuid}'`
  }
}
