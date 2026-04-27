/**
 * Card domain errors.
 *
 * @module
 */
import { Schema } from "effect"

export class CardSpaceNotFoundError extends Schema.TaggedError<CardSpaceNotFoundError>()(
  "CardSpaceNotFoundError",
  {
    identifier: Schema.String
  }
) {
  override get message(): string {
    return `Card space '${this.identifier}' not found`
  }
}

export class CardNotFoundError extends Schema.TaggedError<CardNotFoundError>()(
  "CardNotFoundError",
  {
    identifier: Schema.String,
    cardSpace: Schema.String
  }
) {
  override get message(): string {
    return `Card '${this.identifier}' not found in card space '${this.cardSpace}'`
  }
}

export class MasterTagNotFoundError extends Schema.TaggedError<MasterTagNotFoundError>()(
  "MasterTagNotFoundError",
  {
    identifier: Schema.String,
    cardSpace: Schema.String
  }
) {
  override get message(): string {
    return `Master tag '${this.identifier}' not found in card space '${this.cardSpace}'`
  }
}
