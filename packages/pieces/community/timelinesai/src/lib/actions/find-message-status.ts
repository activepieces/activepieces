import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { timelinesaiAuth } from '../common/auth';
import { findMessageStatus as findMessageStatusProps } from '../common/properties';
import { findMessageStatus as findMessageStatusSchema } from '../common/schemas';
import { findMessageStatus as findMessageStatusMethod } from '../common/methods';

export const findMessageStatus = createAction({
  auth: timelinesaiAuth,
  name: 'findMessageStatus',
  displayName: 'Find Message Status',
  description: 'Lookup a message\'s delivery status by message ID',
  props: findMessageStatusProps(),
  async run({ auth, propsValue }) {
    const { api_key } = auth as { api_key: string };
    await propsValidation.validateZod(
      propsValue,
      findMessageStatusSchema
    );

    return await findMessageStatusMethod({
      apiKey: api_key,
      ...propsValue,
    });
  },
});
