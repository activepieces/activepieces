// Slack delivers edits, deletions, channel joins and other changes as
// `message` events with a `subtype`. The message triggers fire on new
// messages only, so they skip those. A message with attached files
// (`file_share`), a thread reply also sent to the channel
// (`thread_broadcast`), a `/me` message and a legacy bot message are new.
//
// Without this check an edit starts the flow again with empty `text` (an
// edit's text is under `message.text`), and "Ignore Bot Messages" misses
// edits of a bot's own messages, whose `bot_id` is under `message`. Request
// Approval posts its message and then edits it to add the buttons, so a
// flow that watches the channel it asks for approval in started itself
// again on every edit.
const NEW_MESSAGE_SUBTYPES = new Set<string | undefined>([
  undefined,
  'file_share',
  'thread_broadcast',
  'me_message',
  'bot_message',
]);

export function isNewMessageEvent(event: { subtype?: string }): boolean {
  return NEW_MESSAGE_SUBTYPES.has(event.subtype);
}
