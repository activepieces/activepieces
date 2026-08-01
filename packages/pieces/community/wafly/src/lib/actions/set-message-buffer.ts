import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { waflyAuth, waflyApiCall } from '../common';

export const setMessageBuffer = createAction({
  auth: waflyAuth,
  name: 'set_message_buffer',
  displayName: 'Configure Message Buffer',
  description:
    'Group a person\'s consecutive messages into a single webhook call, so an agent answers once.',
  audience: 'both',
  aiMetadata: {
    description:
      'Turns on or updates message buffering for a Wafly instance. When enabled, consecutive messages from the same person are delivered as one webhook event instead of one per message, so an AI agent replies once with the whole question. This is an instance-level setting, not a per-message step. Idempotent: applying the same values twice leaves the same configuration.',
    idempotent: true,
  },
  props: {
    windowSeconds: Property.Number({
      displayName: 'Silence Window (seconds)',
      description:
        'Restarts on every new message, so delivery happens when the person stops typing. Max 20.',
      required: true,
      defaultValue: 8,
    }),
    maxWaitSeconds: Property.Number({
      displayName: 'Max Wait (seconds)',
      description:
        'Hard ceiling from the first message, so non-stop typing cannot postpone delivery forever. Max 30.',
      required: true,
      defaultValue: 30,
    }),
    maxMessages: Property.Number({
      displayName: 'Max Messages',
      description: 'Deliver immediately once this many pile up. Max 50.',
      required: true,
      defaultValue: 10,
    }),
    mode: Property.StaticDropdown({
      displayName: 'Mode',
      description:
        'Concat keeps the usual payload shape, so existing flows keep working. Batch adds a bufferedMessages array and changes it.',
      required: true,
      defaultValue: 'concat',
      options: {
        options: [
          { label: 'Concat (same payload shape)', value: 'concat' },
          { label: 'Batch (array of messages)', value: 'batch' },
        ],
      },
    }),
    includeGroups: Property.Checkbox({
      displayName: 'Include Group Chats',
      description:
        'Grouping inside a group chat is per participant — different people are never merged together.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { windowSeconds, maxWaitSeconds, maxMessages, mode, includeGroups } =
      context.propsValue;

    // The API works in milliseconds; seconds is what makes sense to someone
    // setting "how long to wait for the person to finish typing".
    return await waflyApiCall({
      auth: context.auth,
      method: HttpMethod.PUT,
      resourceUri: '/inbound-config',
      body: {
        buffer: {
          enabled: true,
          window_ms: windowSeconds * 1000,
          max_wait_ms: maxWaitSeconds * 1000,
          max_messages: maxMessages,
          mode,
          include_groups: includeGroups ?? false,
        },
      },
    });
  },
});
