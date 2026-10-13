import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ringcentralAuth } from '../common/auth';
import { ringcentralCommon } from '../common/client';

export const getExtensionInfo = createAction({
  auth: ringcentralAuth,
  name: 'get_extension_info',
  displayName: 'Get Extension Info',
  description: 'Get profile information for the authenticated user\'s extension.',
  props: {},
  async run(context) {
    return await ringcentralCommon.sendRequest({
      auth: context.auth,
      method: HttpMethod.GET,
      resourcePath: '/restapi/v1.0/account/~/extension/~',
    });
  },
});
