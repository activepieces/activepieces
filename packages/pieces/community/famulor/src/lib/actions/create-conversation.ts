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
  description:
    'Start a new chat with an AI assistant (widget = billed, test = free for development). Returns conversation_id and initial history; use Send Message and Get Conversation to continue.',
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
