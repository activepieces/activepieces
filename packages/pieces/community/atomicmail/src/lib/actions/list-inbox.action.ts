import { createAction } from '@activepieces/pieces-framework';

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

export const listInboxAction = createAction({
  requireAuth: false,
  name: 'list_inbox',
  displayName: 'List Inbox',
  description:
    'Get up to 50 recent messages with subject, sender, preview, and message IDs.',
  audience: 'both',
  aiMetadata: {
    description:
      'List up to 50 newest inbox messages with id, subject, from, preview. Prefer over raw jmap_request for inbox reads. Read-only; safe to retry.',
    idempotent: true,
  },
  props: {
    store_hint: projectStoreHintProp,
    account_id: accountIdProp,
    api_key: optionalApiKeyProp,
  },
  async run(context) {
    const accountId = normalizeAccountId(context.propsValue.account_id);
    const inlineKey = context.propsValue.api_key?.trim();
    await assertStoredCredentials(context, accountId, inlineKey || undefined);
    const session = await createSession(context, accountId);
    const result = await executePreset(session, 'list_inbox.json');
    return result.body;
  },
});
