import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { timelinesaiAuth } from '../common/auth';
import { findMessage as findMessageProps } from '../common/properties';
import { findMessage as findMessageSchema } from '../common/schemas';
import { findMessage as findMessageMethod } from '../common/methods';

export const findMessage = createAction({
  auth: timelinesaiAuth,
  name: 'findMessage',
  displayName: 'Find Message',
  description: 'Lookup a message by its WhatsApp message ID',
  props: findMessageProps(),
  async run({ auth, propsValue }) {
    const { api_key } = auth as { api_key: string };
    await propsValidation.validateZod(
      propsValue,
      findMessageSchema
    );

    return await findMessageMethod({
      apiKey: api_key,
      ...propsValue,
    });
  },
});
