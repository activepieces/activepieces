import { createAction, Property } from '@activepieces/pieces-framework';

import { accountIdProp } from '../common/props';
import { createSession, normalizeAccountId } from '../common/session';

export const registerAction = createAction({
  requireAuth: false,
  name: 'register',
  displayName: 'Register Inbox',
  description:
    'Create or sign in to an inbox. Returns your @atomicmail.ai address and API key on first signup (~30s PoW).',
  audience: 'both',
  aiMetadata: {
    description:
      'Register or idempotently log in an Atomic Mail inbox (5–21 char username). Returns apiKey on first signup — wire it into a connection or a later step. PoW may take ~30s. After success, set up ~5 min inbox polling or manual fetch per help topic cron.',
    idempotent: false,
  },
  props: {
    connection_hint: Property.MarkDown({
      value:
        'Credentials save automatically. Use Account namespace `default` on later steps.',
    }),
    username: Property.ShortText({
      displayName: 'Username',
      description: 'Inbox username (5–21 characters, local-part of @atomicmail.ai address)',
      required: true,
    }),
    forced: Property.Checkbox({
      displayName: 'Replace existing credentials',
      description:
        'Allow registering a different username in the same account namespace (back up stored credentials first)',
      required: false,
      defaultValue: false,
    }),
    account_id: accountIdProp,
  },
  async run(context) {
    const username = context.propsValue.username.trim().toLowerCase();
    if (username.length < 5 || username.length > 21) {
      throw new Error('Username must be 5–21 characters.');
    }

    const accountId = normalizeAccountId(context.propsValue.account_id);
    const session = await createSession(context, accountId);
    const result = await session.register(username, {
      forced: context.propsValue.forced === true,
    });

    return {
      inbox: result.inbox,
      accountId: result.accountId,
      apiKey: result.apiKey,
      idempotent: result.idempotent ?? false,
      accountNamespace: accountId,
      hint:
        result.apiKey !== undefined
          ? 'Save apiKey for reference or use {{step.apiKey}} in later steps.'
          : 'Existing inbox — apiKey omitted (idempotent replay).',
    };
  },
});
