import { describe, expect, it } from 'vitest';
import { isNewMessageEvent } from '../src/lib/common/message-events';

describe('isNewMessageEvent', () => {
  it.each([undefined, 'file_share', 'thread_broadcast', 'me_message', 'bot_message'])(
    'keeps a new message with subtype %s',
    (subtype) => {
      expect(isNewMessageEvent({ subtype })).toBe(true);
    },
  );

  it.each(['message_changed', 'message_deleted', 'message_replied', 'channel_join', 'channel_topic'])(
    'skips a %s event',
    (subtype) => {
      expect(isNewMessageEvent({ subtype })).toBe(false);
    },
  );
});
