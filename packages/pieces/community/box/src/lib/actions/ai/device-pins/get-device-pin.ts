import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const getDevicePinAction = createAction({
  auth: boxAuth,
  name: 'box_get_device_pin',
  displayName: 'Get Device Pin',
  description: 'Gets a Box device pin by ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one device pin with the user who owns it and the product name of the pinned device. Needs admin rights. Get the ID from List Device Pins.',
    idempotent: true,
  },
  props: {
    devicePinId: boxAiProps.devicePinId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/device_pinners/${encodeURIComponent(propsValue.devicePinId)}`,
    });
  },
});
