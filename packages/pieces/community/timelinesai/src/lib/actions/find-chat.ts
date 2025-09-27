import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { timelinesaiAuth } from '../common/auth';
import { findChat as findChatProps } from '../common/properties';
import { findChat as findChatSchema } from '../common/schemas';
import { findChat as findChatMethod } from '../common/methods';

export const findChat = createAction({
  auth: timelinesaiAuth,
  name: 'findChat',
  displayName: 'Find Chat',
  description: 'Look up a chat by parameters such as chat_id, phone, name, etc.',
  props: findChatProps(),
  async run({ auth, propsValue }) {
    const { api_key } = auth as { api_key: string };
    await propsValidation.validateZod(
      propsValue,
      findChatSchema
    );

    return await findChatMethod({
      apiKey: api_key,
      ...propsValue,
    });
  },
});
