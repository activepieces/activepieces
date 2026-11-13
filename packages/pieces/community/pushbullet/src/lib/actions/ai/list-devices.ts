import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bushbulletAuth } from '../../common/auth';
import { pushbulletApi } from '../../common/client';
import { pushbulletOutputSchemas } from '../../common/output-schemas';

export const aiListDevices = createAction({
  auth: bushbulletAuth,
  name: 'ai_list_devices',
  displayName: 'List Devices',
  description: 'Lists the devices on the account.',
  audience: 'ai',
  classification: 'SEARCH',
  outputSchema: pushbulletOutputSchemas.listDevices,
  aiMetadata: {
    description:
      'Lists the active devices (phones, browsers, desktop apps) connected to the Pushbullet account, with their iden, nickname, model and whether they can receive pushes. Use the iden as deviceIden in Send Note or Send Link to target one device. An empty list means no device is installed, and pushes then only reach the account history.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const response = await pushbulletApi.request<{ devices?: unknown[] }>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/devices',
      queryParams: { active: 'true' },
    });
    return { devices: response.devices ?? [] };
  },
});
