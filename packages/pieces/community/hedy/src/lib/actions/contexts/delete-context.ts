import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { hedyAuth } from '../../auth';
import { createClient } from '../../common/client';
import { commonProps } from '../../common/props';
import { assertIdPrefix } from '../../common/validation';

export const deleteContext = createAction({
  auth: hedyAuth,
  name: 'delete-context',
  displayName: 'Delete Session Context',
  description: 'Delete a session context.',
  props: {
    contextId: commonProps.contextId,
  },
  async run(context) {
    const contextId = assertIdPrefix(
      context.propsValue['contextId'] as string,
      'ctx_',
      'Context ID',
    );
    const client = createClient(context.auth);

    const response = await client.request({
      method: HttpMethod.DELETE,
      path: `/contexts/${contextId}`,
    });

    return response ?? { success: true, deleted: true };
  },
});
