/**
 * Messaging domain errors: channels, messages, threads, reactions, saved messages.
 *
 * @module
 */
import { Schema } from "effect"

/**
 * Channel not found in the workspace.
 */
export class ChannelNotFoundError extends Schema.TaggedError<ChannelNotFoundError>()(
  "ChannelNotFoundError",
  {
    identifier: Schema.String
  }
) {
  override get message(): string {
    return `Channel '${this.identifier}' not found`
  }
}

/**
 * Message not found in the channel.
 */
export class MessageNotFoundError extends Schema.TaggedError<MessageNotFoundError>()(
  "MessageNotFoundError",
  {
    messageId: Schema.String,
    channel: Schema.String
  }
) {
  override get message(): string {
    return `Message '${this.messageId}' not found in channel '${this.channel}'`
  }
}

/**
 * Thread reply not found.
 */
export class ThreadReplyNotFoundError extends Schema.TaggedError<ThreadReplyNotFoundError>()(
  "ThreadReplyNotFoundError",
  {
    replyId: Schema.String,
    messageId: Schema.String
  }
) {
  override get message(): string {
    return `Thread reply '${this.replyId}' not found on message '${this.messageId}'`
  }
}

/**
 * Activity message not found.
 */
export class ActivityMessageNotFoundError extends Schema.TaggedError<ActivityMessageNotFoundError>()(
  "ActivityMessageNotFoundError",
  {
    messageId: Schema.String
  }
) {
  override get message(): string {
    return `Activity message '${this.messageId}' not found`
  }
}

/**
 * Reaction not found on message.
 */
export class ReactionNotFoundError extends Schema.TaggedError<ReactionNotFoundError>()(
  "ReactionNotFoundError",
  {
    messageId: Schema.String,
    emoji: Schema.String
  }
) {
  override get message(): string {
    return `Reaction '${this.emoji}' not found on message '${this.messageId}'`
  }
}

/**
 * Saved message not found.
 */
export class SavedMessageNotFoundError extends Schema.TaggedError<SavedMessageNotFoundError>()(
  "SavedMessageNotFoundError",
  {
    messageId: Schema.String
  }
) {
  override get message(): string {
    return `Saved message for '${this.messageId}' not found`
  }
}
