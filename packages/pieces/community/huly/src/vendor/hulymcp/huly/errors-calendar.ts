/**
 * Calendar domain errors.
 *
 * @module
 */
import { Schema } from "effect"

/**
 * Calendar event not found.
 */
export class EventNotFoundError extends Schema.TaggedError<EventNotFoundError>()(
  "EventNotFoundError",
  {
    eventId: Schema.String
  }
) {
  override get message(): string {
    return `Event '${this.eventId}' not found`
  }
}

/**
 * Recurring calendar event not found.
 */
export class RecurringEventNotFoundError extends Schema.TaggedError<RecurringEventNotFoundError>()(
  "RecurringEventNotFoundError",
  {
    eventId: Schema.String
  }
) {
  override get message(): string {
    return `Recurring event '${this.eventId}' not found`
  }
}
