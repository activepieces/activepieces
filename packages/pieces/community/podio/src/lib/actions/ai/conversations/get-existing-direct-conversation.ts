import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetConversationOutputSchema } from '../../../output-schemas';

export const getExistingDirectConversationAction = createAction({
  auth: podioAuth,
  name: 'podio_get_existing_direct_conversation',
  outputSchema: podioGetConversationOutputSchema,
  displayName: 'Get Existing Direct Conversation',
  description: 'Gets your existing one-to-one conversation with a user.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads the existing one-to-one Podio conversation between the connected user and another user, and fails with Not found when there is none (start one with Create Conversation). The user id comes from List Space Members or Get Organization Members.',
    idempotent: true,
  },
  props: {
    userId: podioAiProps.id({ required: true, displayName: 'User ID', description: 'The user id of the other person, from List Space Members or Get Organization Members.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: `/conversation/direct/${propsValue.userId}` });
  },
});
