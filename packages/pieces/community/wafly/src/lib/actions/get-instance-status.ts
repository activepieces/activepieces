import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { waflyAuth, waflyApiCall } from '../common';

export const getInstanceStatus = createAction({
  auth: waflyAuth,
  name: 'get_instance_status',
  displayName: 'Get Instance Status',
  description: 'Check whether the WhatsApp instance is connected.',
  audience: 'both',
  aiMetadata: {
    description:
      'Reads the current connection state of the Wafly WhatsApp instance, including whether it is connected and which phone number is paired. Read-only and idempotent: safe to call repeatedly, typically before sending messages or to alert when a number drops.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    return await waflyApiCall({
      auth: context.auth,
      method: HttpMethod.GET,
      resourceUri: '/status',
    });
  },
});
