import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { screenpipeAuth } from '../auth';
import { screenpipeApiRequest } from '../common';

export const listAudioDevices = createAction({
  auth: screenpipeAuth,
  name: 'list_audio_devices',
  displayName: 'List Audio Devices',
  description: 'List all available audio devices',
  props: {},
  async run(context) {
    return await screenpipeApiRequest({
      auth: context.auth,
      method: HttpMethod.GET,
      endpoint: '/audio/list',
    });
  },
});
