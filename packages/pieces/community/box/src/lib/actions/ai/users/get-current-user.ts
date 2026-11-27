import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxCreateUserOutputSchema } from '../../../output-schemas';

export const getCurrentUserAction = createAction({
  auth: boxAuth,
  name: 'box_get_current_user',
  outputSchema: boxCreateUserOutputSchema,
  displayName: 'Get Current User',
  description: 'Gets the Box user the connection belongs to.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns the connected Box user: ID, name, login email, role, enterprise and storage used.',
    idempotent: true,
  },
  props: {
    fields: boxAiProps.fields({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({ auth, method: HttpMethod.GET, path: '/users/me', query: { fields: propsValue.fields } });
  },
});
