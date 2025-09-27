import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { timelinesaiAuth } from '../common/auth';
import { closeChat as closeChatProps } from '../common/properties';
import { closeChat as closeChatSchema } from '../common/schemas';
import { closeChat as closeChatMethod } from '../common/methods';

export const closeChat = createAction({
  auth: timelinesaiAuth,
  name: 'closeChat',
  displayName: 'Close Chat',
  description: 'Programmatically mark a chat as closed by its chat_id',
  props: closeChatProps(),
  async run({ auth, propsValue }) {
    const { api_key } = auth as { api_key: string };
    await propsValidation.validateZod(
      propsValue,
      closeChatSchema
    );

    return await closeChatMethod({
      apiKey: api_key,
      ...propsValue,
    });
  },
});
