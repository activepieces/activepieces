import { createAction, Property } from '@activepieces/pieces-framework';

import { executePreset } from '../common/jmap';
import {
  accountIdProp,
  optionalApiKeyProp,
  projectStoreHintProp,
} from '../common/props';
import {
  assertStoredCredentials,
  createSession,
  normalizeAccountId,
} from '../common/session';

export const replyAction = createAction({
  requireAuth: false,
  name: 'reply',
  displayName: 'Reply to Email',
  description: 'Reply to a message using its Mail ID from List Inbox.',
  audience: 'both',
  aiMetadata: {
    description:
      'Reply to a message by MAIL_ID from list_inbox. Each call sends a new reply — not idempotent.',
    idempotent: false,
  },
  props: {
    store_hint: projectStoreHintProp,
    mail_id: Property.ShortText({
      displayName: 'Mail ID',
      description: 'Message ID from **List Inbox** (use the `id` field)',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Body',
      required: true,
    }),
    account_id: accountIdProp,
    api_key: optionalApiKeyProp,
  },
  async run(context) {
    const accountId = normalizeAccountId(context.propsValue.account_id);
    await assertStoredCredentials(context, accountId);
    const session = await createSession(context, accountId);
    const result = await executePreset(session, 'reply.json', {
      MAIL_ID: context.propsValue.mail_id.trim(),
      BODY: context.propsValue.body,
    });
    return result.body;
  },
});
