import { createAction } from '@activepieces/pieces-framework';
import { propsValidation } from '@activepieces/pieces-common';
import { famulorAuth } from '../..';
import { famulorCommon } from '../common';

function filterEmptyVariables(
  vars: Record<string, any> | undefined,
): Record<string, any> | undefined {
  if (!vars) return undefined;
  const filtered = Object.fromEntries(
    Object.entries(vars).filter(([, v]) => v !== '' && v !== null && v !== undefined),
  );
  return Object.keys(filtered).length > 0 ? filtered : undefined;
}

export const createConversation = createAction({
  auth: famulorAuth,
  name: 'createConversation',
  displayName: 'Create Conversation',
  description: 'Start a new chat conversation with an AI assistant.',
  audience: 'both',
  aiMetadata: {
    description:
      'Start a brand-new chat conversation with an AI assistant, optionally as a widget or test conversation and with initial variables. Use to open a fresh thread before sending messages; each call creates a new conversation, so it is not idempotent. To continue an existing thread use Send Message instead.',
    idempotent: false,
  },
  props: famulorCommon.createConversationProperties(),
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, famulorCommon.createConversationSchema);

    return await famulorCommon.createConversation({
      auth: auth.secret_text,
      assistant_id: propsValue.assistant_id as string,
      type: propsValue.type as 'widget' | 'test' | undefined,
      variables: filterEmptyVariables(propsValue.variables as Record<string, any> | undefined),
    });
  },
});
