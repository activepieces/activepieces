/**
 * Notification domain errors.
 *
 * @module
 */
import { Schema } from "effect"

/**
 * Notification not found.
 */
export class NotificationNotFoundError extends Schema.TaggedError<NotificationNotFoundError>()(
  "NotificationNotFoundError",
  {
    notificationId: Schema.String
  }
) {
  override get message(): string {
    return `Notification '${this.notificationId}' not found`
  }
}

/**
 * Notification context not found.
 */
export class NotificationContextNotFoundError extends Schema.TaggedError<NotificationContextNotFoundError>()(
  "NotificationContextNotFoundError",
  {
    contextId: Schema.String
  }
) {
  override get message(): string {
    return `Notification context '${this.contextId}' not found`
  }
}
