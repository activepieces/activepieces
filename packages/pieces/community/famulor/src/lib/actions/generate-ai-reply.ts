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

export const generateAiReply = createAction({
  auth: famulorAuth,
  name: 'generateAiReply',
  displayName: 'Generate AI Reply',
  description: 'Generate an AI reply from an assistant for a given customer.',
  audience: 'both',
  aiMetadata: {
    description:
      'Generate (draft) an AI assistant reply to a customer message, identified by assistant and customer identifier, with optional template variables. Use to obtain suggested reply text without it being committed to a conversation; to post a message into a real thread use Send Message. Each call generates fresh output, so it is not idempotent.',
    idempotent: false,
  },
  props: famulorCommon.generateAiReplyProperties(),
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, famulorCommon.generateAiReplySchema);

    return await famulorCommon.generateAiReply({
      auth: auth.secret_text,
      assistant_id: propsValue.assistant_id as number,
      customer_identifier: propsValue.customer_identifier as string,
      message: propsValue.message as string,
      variables: filterEmptyVariables(propsValue.variables as Record<string, any> | undefined),
    });
  },
});
